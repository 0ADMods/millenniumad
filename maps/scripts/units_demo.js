const DEMO_PLAYERS = [
	{ "player": 1, "civ": "anglo", "label": "Anglo" },
	{ "player": 2, "civ": "byza", "label": "Byzantines" },
	{ "player": 3, "civ": "caro", "label": "Carolingians" },
	{ "player": 4, "civ": "norse", "label": "Norse" },
	{ "player": 5, "civ": "rus", "label": "Rus" },
	{ "player": 6, "civ": "umay", "label": "Umayyads" }
];

// Leave empty to spawn all. Set one of these to isolate crashes.
const ENABLED_CIVS = [];
const ENABLED_PLAYERS = [];
const ENABLE_STRUCTURES = true;
const ENABLE_UNITS = true;
const ENABLED_STRUCTURE_GROUPS = [];
const ENABLED_UNIT_GROUPS = [];

const UNIT_SIZE = 6;
const MAP_CENTER = 960;
const CITY_RING_RADIUS = 300;
const BUILDING_RING_STEP = 52;
const UNIT_RING_START = 170;
const UNIT_RING_STEP = 24;
const ANGLE_STEP = Math.PI / 7;

function getTemplatesForPrefix(prefix)
{
	const cmpTemplateManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_TemplateManager);
	return cmpTemplateManager.FindAllTemplates(false)
		.filter(template => template.startsWith(prefix))
		.sort();
}

function isEnabledDemoPlayer(demoPlayer)
{
	return (!ENABLED_CIVS.length || ENABLED_CIVS.includes(demoPlayer.civ)) &&
		(!ENABLED_PLAYERS.length || ENABLED_PLAYERS.includes(demoPlayer.player));
}

function getStructureGroup(template)
{
	if (template.includes("/wall"))
		return "walls";
	if (template.includes("/tower") || template.includes("/outpost"))
		return "defenses";
	if (template.includes("/dock"))
		return "dock";
	if (template.includes("/civil_centre"))
		return "civic";
	if (template.includes("/fortress") || template.includes("/palace") || template.includes("/wonder") || template.includes("/military"))
		return "monuments";
	return "core";
}

function getUnitGroup(template)
{
	if (template.includes("/ship_"))
		return "ships";
	if (template.includes("/siege_"))
		return "siege";
	if (template.includes("/hero_") || template.includes("/minister") || template.includes("/strategos"))
		return "special";
	if (template.includes("/support_"))
		return "support";
	return "army";
}

function filterTemplatesByGroup(templates, enabledGroups, groupFn)
{
	if (!enabledGroups.length)
		return templates;
	return templates.filter(template => enabledGroups.includes(groupFn(template)));
}

function getEntitySize(ent)
{
	const cmpFootprint = Engine.QueryInterface(ent, IID_Footprint);
	if (!cmpFootprint)
		return null;

	const shape = cmpFootprint.GetShape();
	if (shape.type == "circle")
		return {
			"width": shape.radius * 2,
			"depth": shape.radius * 2
		};

	return {
		"width": shape.width || UNIT_SIZE,
		"depth": shape.depth || UNIT_SIZE
	};
}

function spawnTemplate(template, owner)
{
	const ent = Engine.AddEntity(template);
	if (!ent)
	{
		error("Units Demo: failed to load " + template);
		return INVALID_ENTITY;
	}

	const cmpOwnership = Engine.QueryInterface(ent, IID_Ownership);
	if (cmpOwnership)
		cmpOwnership.SetOwner(owner);

	return ent;
}

function getCityAnchor(index)
{
	const angle = -Math.PI / 2 + index * (Math.PI * 2 / DEMO_PLAYERS.length);
	return {
		"x": MAP_CENTER + Math.cos(angle) * CITY_RING_RADIUS,
		"z": MAP_CENTER + Math.sin(angle) * CITY_RING_RADIUS,
		"angle": angle
	};
}

function getPlacementRotation(anchorX, anchorZ, x, z)
{
	return Math.atan2(anchorX - x, anchorZ - z);
}

function getStructurePriority(template)
{
	if (template.includes("/civil_centre"))
		return 0;
	if (template.includes("/house"))
		return 5;
	if (template.includes("/field"))
		return 6;
	if (template.includes("/farmstead") || template.includes("/storehouse") || template.includes("/market") || template.includes("/dock"))
		return 4;
	if (template.includes("/barracks") || template.includes("/stable") || template.includes("/range") || template.includes("/arsenal") || template.includes("/forge"))
		return 3;
	if (template.includes("/fortress") || template.includes("/palace") || template.includes("/wonder") || template.includes("/military"))
		return 2;
	if (template.includes("/wall") || template.includes("/outpost") || template.includes("/tower"))
		return 7;
	return 1;
}

function getUnitPriority(template)
{
	if (template.includes("/support_"))
		return 0;
	if (template.includes("/hero_") || template.includes("/minister") || template.includes("/strategos"))
		return 1;
	if (template.includes("/infantry_"))
		return 2;
	if (template.includes("/cavalry_"))
		return 3;
	if (template.includes("/champion_"))
		return 4;
	if (template.includes("/siege_"))
		return 5;
	if (template.includes("/ship_"))
		return 6;
	return 7;
}

function sortByPriority(templates, priorityFn)
{
	return templates
		.slice()
		.sort((left, right) =>
		{
			const priority = priorityFn(left) - priorityFn(right);
			if (priority)
				return priority;
			return left.localeCompare(right);
		});
}

Trigger.prototype.PlaceTemplate = function(template, owner, x, z, rotation)
{
	const ent = spawnTemplate(template, owner);
	if (ent == INVALID_ENTITY)
		return null;

	const size = getEntitySize(ent);
	if (!size)
	{
		print("Units Demo: " + template + " has no footprint\n");
		return null;
	}

	const cmpPosition = Engine.QueryInterface(ent, IID_Position);
	if (!cmpPosition)
	{
		print("Units Demo: " + template + " has no position\n");
		return null;
	}

	cmpPosition.JumpTo(x, z);
	cmpPosition.SetYRotation(rotation);
	return size;
};

Trigger.prototype.PlaceStructureCluster = function(anchor, templates, owner)
{
	let ringIndex = 0;
	let placedInRing = 0;
	let slotsInRing = 1;
	for (const template of templates)
	{
		if (template.includes("/wallset_"))
			continue;

		if (template.includes("/civil_centre"))
		{
			this.PlaceTemplate(template, owner, anchor.x, anchor.z, anchor.angle + Math.PI);
			continue;
		}

		if (placedInRing >= slotsInRing)
		{
			++ringIndex;
			placedInRing = 0;
			slotsInRing = 6 + ringIndex * 4;
		}

		const radius = 60 + ringIndex * BUILDING_RING_STEP;
		const angle = anchor.angle + placedInRing * (Math.PI * 2 / slotsInRing);
		const x = anchor.x + Math.cos(angle) * radius;
		const z = anchor.z + Math.sin(angle) * radius;
		const rotation = getPlacementRotation(anchor.x, anchor.z, x, z);
		this.PlaceTemplate(template, owner, x, z, rotation);
		++placedInRing;
	}
};

Trigger.prototype.PlaceUnitCluster = function(anchor, templates, owner)
{
	let ringIndex = 0;
	let placedInRing = 0;
	let slotsInRing = 8;

	for (const template of templates)
	{
		if (placedInRing >= slotsInRing)
		{
			++ringIndex;
			placedInRing = 0;
			slotsInRing = 10 + ringIndex * 4;
		}

		const radius = UNIT_RING_START + ringIndex * UNIT_RING_STEP;
		const angle = anchor.angle + Math.PI / 6 + placedInRing * (Math.PI * 2 / slotsInRing);
		const x = anchor.x + Math.cos(angle) * radius;
		const z = anchor.z + Math.sin(angle) * radius;
		const rotation = getPlacementRotation(anchor.x, anchor.z, x, z);
		this.PlaceTemplate(template, owner, x, z, rotation);
		++placedInRing;
	}
};

Trigger.prototype.InitUnitsDemo = function()
{
	for (let index = 0; index < DEMO_PLAYERS.length; ++index)
	{
		const demoPlayer = DEMO_PLAYERS[index];
		if (!isEnabledDemoPlayer(demoPlayer))
			continue;

		const structureTemplates = filterTemplatesByGroup(
			getTemplatesForPrefix("structures/" + demoPlayer.civ + "/"),
			ENABLED_STRUCTURE_GROUPS,
			getStructureGroup);
		const unitTemplates = filterTemplatesByGroup(
			getTemplatesForPrefix("units/" + demoPlayer.civ + "/"),
			ENABLED_UNIT_GROUPS,
			getUnitGroup);
		const sortedStructures = sortByPriority(structureTemplates, getStructurePriority);
		const sortedUnits = sortByPriority(unitTemplates, getUnitPriority);
		const anchor = getCityAnchor(index);

		const cmpDiplomacy = QueryPlayerIDInterface(demoPlayer.player, IID_Diplomacy);
		if (cmpDiplomacy)
			for (const otherPlayer of DEMO_PLAYERS)
				if (otherPlayer.player != demoPlayer.player)
					cmpDiplomacy.SetEnemy(otherPlayer.player);

		print("Units Demo: player " + demoPlayer.player + " uses civ " + demoPlayer.label + "\n");
		if (ENABLE_STRUCTURES)
		{
			print("Units Demo: placing " + sortedStructures.length + " structures for player " + demoPlayer.player + "\n");
			this.PlaceStructureCluster(anchor, sortedStructures, demoPlayer.player);
		}
		if (ENABLE_UNITS)
		{
			print("Units Demo: placing " + sortedUnits.length + " units for player " + demoPlayer.player + "\n");
			this.PlaceUnitCluster(anchor, sortedUnits, demoPlayer.player);
		}
	}

	print("Units Demo: spawn complete\n");
};

{
	const cmpTrigger = Engine.QueryInterface(SYSTEM_ENTITY, IID_Trigger);
	cmpTrigger.DoAfterDelay(0, "InitUnitsDemo", {});
}
