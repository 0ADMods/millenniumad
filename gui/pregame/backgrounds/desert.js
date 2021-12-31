g_BackgroundLayerData.push(
	[
		{
			"offset": (time, width) => 0.07 * width * Math.cos(0.1 * time),
			"sprite": "desert-03",
			"tiling": true
		},
		{
			"offset": (time, width) => 0.05 * width * Math.cos(0.1 * time),
			"sprite": "desert-01",
			"tiling": true
		},
		{
			"offset": (time, width) => 0.05 * width * Math.cos(0.1 * time),
			"sprite": "desert-02",
			"tiling": true
		}
	]);
