namespace steam {
	const states = ["open", "closed"];
	for (const index of $range(0, 1)) {
		const currentState = states[index];
		core.register_node("crafter_steam:ash_pan_" + currentState, {
			drawtype: Drawtype.mesh,
			use_texture_alpha: TextureAlpha.clip,
			mesh: `steam_ash_pan_${currentState}.gltf`,
			tiles: [
				"steam_ash_pan_body.png",
				"steam_ash_pan_doors.png",
				"steam_ash_pan_lever.png",
				"stone.png",
				"dirt.png",
			],
			paramtype2: ParamType2["4dir"],
			groups: {
				stone: 2,
				ash_pan: 1,
				opened: currentState == "open" ? 1 : 0,
			},
			sounds: crafter.stoneSound(),

			on_timer(position, elapsed) {
				// burnFuelAndDoSideEffects(position, index == 0);
				// manipulateFireEntity(
				// 	position,
				// 	fireboxEntities.getOrCreate(position)
				// );
				// timerStart(position);
			},

			on_construct(position) {
				// fireboxEntities.getOrCreate(position);
				// timerStart(position);
			},

			on_rightclick(position, node, clicker, itemStack, pointedThing) {
				// const fireboxData = utility.getMeta(position, FireboxMeta);
				// const itemStackName = itemStack.get_name();

				//? Open/close doors.
				const newIndex = (index + 1) % 2;
				const newState = states[newIndex];
				core.swap_node(position, {
					name: "crafter_steam:ash_pan_" + newState,
					param2: node.param2,
				});
				core.sound_play("steam_boiler_door", {
					pos: pointedThing.under!,
					pitch: (math.random(80, 99) + math.random()) / 100,
				});
			},
		});
	}
}
