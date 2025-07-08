namespace steam {
	const timerStart = kickOnSteamNodeTimer;

	// PSI.
	const maxPressure = 300;

	// The boiler explodes if it's empty at this pressure.
	const dryBoilExplosionPressure = 100;

	// Imperial.
	const boilingPoint = 212;

	// 1 unit water is 3 units pressure.
	// What are these units? Well it's very simple

	class BoilerMeta
		extends utility.CrafterMeta
		implements WaterVesselMeta, HeatedVesselMeta, PressureVesselMeta
	{
		temperature: number = 0;
		/** Percentage. */
		waterLevel: number = 0;
		/** PSI. */
		pressure: number = 0;
	}

	// This is encapsulating the heat data from a firebox.
	class FireBoxShallowMeta
		extends utility.CrafterMeta
		implements HeatedVesselMeta
	{
		temperature: number = 0;
	}

	function boil(pos: Vec3): void {
		const boilerData = utility.getMeta(pos, BoilerMeta);

		const belowPos = vector.create3d(pos.x, pos.y - 1, pos.z);
		const nodeBelow = core.get_node(belowPos);

		if (core.get_item_group(nodeBelow.name, "firebox") > 0) {
			const fireBoxData = utility.getMeta(belowPos, FireBoxShallowMeta);

			// Thermodynamics is a bitch.
			if (fireBoxData.temperature >= 10) {
				fireBoxData.temperature -= 10;
				boilerData.temperature += 2;
			}
			fireBoxData.write();
		}

		if (boilerData.waterLevel <= 0) {
			boilerData.waterLevel = 0;

			print("pressure:", boilerData.pressure);

			if (boilerData.pressure > dryBoilExplosionPressure) {
				core.log(
					LogLevel.warning,
					"boiler explosions are still disabled"
				);
				// core.remove_node(pos);
				// tnt.tnt(pos, 2);
			}
		}

		// You better hope the boiler has water in it.
		// Or install a sight glass.
		if (boilerData.temperature > boilingPoint) {
			// Just know if there's no water in here it's boiling the moisture in the air.

			const temperatureDifference = boilerData.temperature % boilingPoint;

			boilerData.temperature -= temperatureDifference;

			boilerData.pressure += temperatureDifference * 3;
			boilerData.waterLevel -= 1;
			if (boilerData.waterLevel < 0) {
				// Things might get really bad in a second lol.
				boilerData.waterLevel = 0;
			}
		}

		boilerData.write();
	}

	core.register_node("crafter_steam:boiler", {
		drawtype: Drawtype.mesh,
		mesh: "steam_boiler.gltf",
		tiles: ["steam_boiler.png"],
		paramtype2: ParamType2["4dir"],
		groups: { stone: 1, pathable: 1, steam: 1, water_vessel: 1 },
		sounds: crafter.stoneSound(),

		on_rightclick(position, node, clicker, itemStack, pointedThing) {
			if (clicker == null) {
				return;
			}
			const itemName = itemStack.get_name();

			if (itemName != "crafter:bucket_water") {
				return;
			}

			const boilerData = utility.getMeta(position, BoilerMeta);

			boilerData.waterLevel += 10;
			if (boilerData.waterLevel > 100) {
				boilerData.waterLevel = 100;
			}

			print("waterLevel: ", boilerData.waterLevel);

			boilerData.write();
			itemStack.set_name("crafter:bucket");
			clicker.set_wielded_item(itemStack);
		},

		on_timer(position, elapsed) {
			boil(position);
			timerStart(position);
		},
		on_construct(position) {
			timerStart(position);
		},
	});
}
