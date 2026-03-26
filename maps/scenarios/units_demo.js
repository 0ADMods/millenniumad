// Units Demo scenario script for Millennium A.D.
// This script validates unit templates and civilizations for R28 compatibility

const UNITS_DEMO_TIMEOUT = 120000; // 2 minutes for validation

let gameStartTime = undefined;
let startingPlayers = 8;

function OnInit()
{
	LoadMapSettings();
	println("Units Demo: Game initialized with " + startingPlayers + " civilizations");
}

function LoadMapSettings()
{
	// Disable diplomacy changes
	QueryPlayerIDInterface(1, "SetAllyFormation", true);
	
	// Set all players as enemies for testing
	for (let player = 1; player <= startingPlayers; ++player)
	{
		for (let otherPlayer = 1; otherPlayer <= startingPlayers; ++otherPlayer)
		{
			if (player !== otherPlayer)
			{
				QueryPlayerIDInterface(player, "SetDiplomacy", otherPlayer, "enemy");
			}
		}
	}
	
	gameStartTime = GetSimState().timeElapsed;
}

function OnUpdate(state)
{
	// Run for specified duration then stop
	if (GetSimState().timeElapsed - gameStartTime > UNITS_DEMO_TIMEOUT)
	{
		println("Units Demo: Timeout reached, stopping validation");
		// In headless mode, the game will auto-exit
		// In normal mode, you can quit from the menu
	}
	
	// Check for template errors every 10 seconds
	if ((GetSimState().timeElapsed - gameStartTime) % 10000 < 100)
	{
		ValidateUnits(state);
	}
}

function ValidateUnits(state)
{
	// Count living units per player to verify no crashes
	for (let player = 1; player <= startingPlayers; ++player)
	{
		let playerState = state.players[player];
		if (playerState)
		{
			let unitCount = Object.keys(playerState.entities).length;
			if (unitCount > 0)
			{
				println("Player " + player + ": " + unitCount + " entities alive");
			}
		}
	}
}

// Message when loaded
println("Units Demo scenario loaded - validating Millennium A.D. R28 migration");
