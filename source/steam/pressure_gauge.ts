namespace steam {
	const timerStart = kickOnSteamNodeTimer;
	const safePressure = maxSafeBoilerPressure;

	class PressureGaugeEntity extends types.Entity {
		name: string = "crafter_steam:pressure_gauge_entity";
		initial_properties: ObjectProperties = {
			pointable: false,
			visual: EntityVisual.mesh,
			mesh: "steam_pressure_gauge.gltf",
			textures: [
				"steam_pressure_gauge_bracket.png",
				"steam_pressure_gauge_inlet.png",
				"steam_pressure_gauge_housing.png",
				"steam_pressure_gauge_probe.png",
				"steam_pressure_gauge_needle.png",
				"steam_pressure_gauge_diaphragm.png",
			],
			visual_size: vector.create3d(1, 1, 1),
			static_save: false,
		};
	}
	utility.registerTSEntity(PressureGaugeEntity);

	const pressureGaugeEntities = new utility.NodeEntityContainer(
		PressureGaugeEntity,
		(pos: Vec3, entity: ObjectRef) => {
			const param2 = core.get_node(pos).param2;
			if (param2 != null) {
				entity.set_yaw(core.dir_to_yaw(core.fourdir_to_dir(param2)));
			} else {
				core.log(LogLevel.error, `Param2 at ${pos} doesn't exist.`);
			}
		}
	);

	class BoilerShallowMeta
		extends utility.CrafterMeta
		implements PressureVesselMeta
	{
		pressure: number = 0;
	}

	const dialSafeEndPoint = maxSafeBoilerPressure / 0.75;

	function manipulatePressureGaugeEntity(
		pos: Vec3,
		entity: ObjectRef | null
	): void {
		if (entity == null) {
			return;
		}

		const param2 = core.get_node(pos).param2;
		if (param2 == null) {
			core.log(LogLevel.error, `Param2 dissapeared at ${pos}`);
			return;
		}

		const dir = core.fourdir_to_dir(param2);

		const newPos = vector.add(pos, dir);

		// Not a steam water vessel.
		if (core.get_item_group(core.get_node(newPos).name, "steam") <= 0) {
			entity.set_animation({ x: 0, y: 0 }, 0, 0, false);
			return;
		}

		const boilerData = utility.getMeta(newPos, BoilerShallowMeta);

		let dialAnimationPoint = boilerData.pressure / dialSafeEndPoint;

		if (dialAnimationPoint > 1) {
			dialAnimationPoint = 1;
		}

		entity.set_animation(
			{ x: dialAnimationPoint, y: dialAnimationPoint },
			0,
			0,
			false
		);
	}

	core.register_node("crafter_steam:pressure_gauge", {
		drawtype: Drawtype.airlike,
		sounds: crafter.stoneSound(),
		groups: { stone: 2, pressure_gauge: 1 },
		paramtype: ParamType1.light,
		paramtype2: ParamType2["4dir"],
		sunlight_propagates: true,
		on_timer(position, elapsed) {
			manipulatePressureGaugeEntity(
				position,
				pressureGaugeEntities.getOrCreate(position)
			);
			timerStart(position);
		},
		on_construct(position) {
			pressureGaugeEntities.getOrCreate(position);
			timerStart(position);
		},
		on_destruct(position) {
			pressureGaugeEntities.delete(position);
		},
	});
}
