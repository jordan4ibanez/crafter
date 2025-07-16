namespace steam {
	const timerStart = kickOnSteamNodeTimer;

	//? Steam pipes.
	const pixel: number = 1 / 16;
	/** Pipe End. */
	const pE: number = pixel * 7;
	/** Pipe Diameter. */
	const pD: number = pixel;
	/** Pipe Length. */
	const pL: number = pD * 8;
	/** Flange Start. */
	const fS: number = pE;
	/** Flange Diameter. */
	const fD: number = pD * 2;

	class PipeMetaData
		extends utility.CrafterMeta
		implements PressureVesselMeta
	{
		pressure: number = 0;
	}

	const pressureOutDirs: Vec3[] = [
		vector.create3d(-1, 0, 0),
		vector.create3d(1, 0, 0),
		vector.create3d(0, 0, -1),
		vector.create3d(0, 0, 1),
		vector.create3d(0, -1, 0),
		vector.create3d(0, 1, 0),
	];

	function pipePressureFlow(pos: Vec3): void {
		const data = utility.getMeta(pos, PipeMetaData);

		// There's nothing to do.
		if (data.pressure <= 0) {
			// But, catch a vacuum.
			if (data.pressure < 0) {
				data.pressure = 0;
				data.write();
			}
			return;
		}

		if (data.pressure > 350) {
			core.log(LogLevel.error, "pipe explosion implementation missing");
			core.dig_node(pos);
		}

		const lookPos = vector.create3d();

		for (const dir of pressureOutDirs) {
			lookPos.x = pos.x + dir.x;
			lookPos.y = pos.y + dir.y;
			lookPos.z = pos.z + dir.z;

			
		}
	}

	core.register_node("crafter_steam:pipe", {
		connects_to: ["group:steam"],
		tiles: ["steam_pipe.png"],
		sounds: crafter.stoneSound(),
		groups: { stone: 2, steam: 1, steam_pipe: 1 },
		drawtype: Drawtype.nodebox,
		paramtype: ParamType1.light,
		sunlight_propagates: true,
		wield_image: "steam_pipe_item.png",
		inventory_image: "steam_pipe_item.png",

		on_timer(position, elapsed) {
			pipePressureFlow(position);
			timerStart(position);
		},

		on_construct(position) {
			timerStart(position);
		},

		collision_box: {
			type: Nodeboxtype.connected,
			disconnected: [-fD, -fD, -fD, fD, fD, fD],
			// +Z.
			connect_back: [-fD, -fD, -fD, fD, fD, pL],
			// -Z.
			connect_front: [-fD, -fD, -pL, fD, fD, fD],
			// +X.
			connect_right: [-fD, -fD, -fD, pL, fD, fD],
			// -X.
			connect_left: [-pL, -fD, -fD, fD, fD, fD],
			// -Y.
			connect_bottom: [-fD, -pL, -fD, fD, fD, fD],
			// +Y.
			connect_top: [-fD, -fD, -fD, fD, pL, fD],
		},

		selection_box: {
			type: Nodeboxtype.connected,
			disconnected: [-fD, -fD, -fD, fD, fD, fD],
			// +Z.
			connect_back: [-fD, -fD, -fD, fD, fD, pL],
			// -Z.
			connect_front: [-fD, -fD, -pL, fD, fD, fD],
			// +X.
			connect_right: [-fD, -fD, -fD, pL, fD, fD],
			// -X.
			connect_left: [-pL, -fD, -fD, fD, fD, fD],
			// -Y.
			connect_bottom: [-fD, -pL, -fD, fD, fD, fD],
			// +Y.
			connect_top: [-fD, -fD, -fD, fD, pL, fD],
		},

		node_box: {
			type: Nodeboxtype.connected,
			disconnected: [-pD, -pD, -pD, pD, pD, pD],
			// +Z.
			connect_back: [
				// Pipe.
				[-pD, -pD, -pD, pD, pD, pE],
				// Flange.
				[pD, -pD, fS, fD, pD, pL],
				[-fD, -pD, fS, -pD, pD, pL],
				[-fD, pD, fS, fD, fD, pL],
				[-fD, -fD, fS, fD, -pD, pL],
			],
			// -Z.
			connect_front: [
				// Pipe.
				[-pD, -pD, -pE, pD, pD, pD],
				// Flange.
				[pD, -pD, -pL, fD, pD, -fS],
				[-fD, -pD, -pL, -pD, pD, -fS],
				[-fD, pD, -pL, fD, fD, -fS],
				[-fD, -fD, -pL, fD, -pD, -fS],
			],
			// +X.
			connect_right: [
				// Pipe.
				[-pD, -pD, -pD, pE, pD, pD],
				// Flange.
				[pL, -pD, pD, fS, pD, fD],
				[pL, -pD, -fD, fS, pD, -pD],
				[pL, pD, -fD, fS, fD, fD],
				[pL, -pD, -fD, fS, -fD, fD],
			],
			// -X.
			connect_left: [
				// Pipe.
				[-pE, -pD, -pD, pD, pD, pD],
				// Flange.
				[-pE, -pD, pD, -pL, pD, fD],
				[-pE, -pD, -fD, -pL, pD, -pD],
				[-pE, pD, -fD, -pL, fD, fD],
				[-pE, -pD, -fD, -pL, -fD, fD],
			],
			// -Y.
			connect_bottom: [
				// Pipe.
				[-pD, -pE, -pD, pD, pD, pD],
				// Flange.
				[-fD, -pL, -pD, -pD, -pE, pD],
				[pD, -pL, -pD, fD, -pE, pD],
				[-fD, -pL, -fD, fD, -pE, -pD],
				[-fD, -pL, pD, fD, -pE, fD],
			],
			// +Y.
			connect_top: [
				// Pipe.
				[-pD, -pD, -pD, pD, pE, pD],
				// Flange.
				[-fD, pE, -pD, -pD, pL, pD],
				[pD, pE, -pD, fD, pL, pD],
				[-fD, pE, -fD, fD, pL, -pD],
				[-fD, pE, pD, fD, pL, fD],
			],
		},
	});
}
