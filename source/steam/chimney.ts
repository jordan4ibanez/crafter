namespace steam {
	core.register_node("crafter_steam:chimney", {
		drawtype: Drawtype.mesh,
		mesh: "steam_chimney.gltf",
		tiles: ["steam_chimney.png"],
		paramtype2: ParamType2["4dir"],
		groups: {
			stone: 1,
			pathable: 1,
			chimney: 1,
		},
		sounds: crafter.stoneSound(),
	});
}
