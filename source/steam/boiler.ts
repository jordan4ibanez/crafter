namespace steam {
	const timerStart = kickOnSteamNodeTimer;

	// The boiler explodes if it's empty at this pressure.
	const dryBoilExplosionPressure = boilerExplosionPressureDry;

	const boilingPoint = waterBoilingPoint;

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

			if (fireBoxData.temperature > boilerData.temperature) {
				//? Boiler gets heated by firebox.

				if (fireBoxData.temperature >= 690) {
					//? Once the boiler is up to full operating temperature, this will create a LOT of heat in the boiler.
					//? A pressure release valve will be necessary unless the goal is to blow up the boiler.
					fireBoxData.temperature -= 24;
					boilerData.temperature += 12;
				} else if (fireBoxData.temperature > 400) {
					fireBoxData.temperature -= 12;
					boilerData.temperature += 6;
				} else if (fireBoxData.temperature > 212) {
					fireBoxData.temperature -= 6;
					boilerData.temperature += 3;
				} else if (fireBoxData.temperature >= 4) {
					fireBoxData.temperature -= 4;
					boilerData.temperature += 2;
				}

				fireBoxData.write();
			} else if (boilerData.temperature > 0) {
				//? Boiler gets cooled by firebox.
				if (fireBoxData.temperature > 100) {
					fireBoxData.temperature += 3;
					boilerData.temperature -= 2;
				} else if (fireBoxData.temperature > 0) {
					fireBoxData.temperature += 6;
					boilerData.temperature -= 3;
				} else {
					//? This branch is most likely hit often when the doors are open and the chimney is on.
					fireBoxData.temperature += 12;
					boilerData.temperature -= 6;
				}

				if (boilerData.temperature < 0) {
					boilerData.temperature = 0;
				}

				fireBoxData.write();
			}
		}

		if (boilerData.waterLevel <= 0) {
			boilerData.waterLevel = 0;

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

			if (boilerData.waterLevel > 0) {
				// The big boiler is much more powerful than this.
				boilerData.pressure += temperatureDifference * 1.5;

				boilerData.waterLevel -= 0.05;
				if (boilerData.waterLevel < 0) {
					// Things might get really bad in a second.
					boilerData.waterLevel = 0;
				}
			} else {
				boilerData.pressure += temperatureDifference;
			}
		}

		// Boiler is always losing pressure and heat.
		if (boilerData.temperature > 0) {
			boilerData.temperature -= 0.5;
			if (boilerData.temperature < 0) {
				boilerData.temperature = 0;
			}
		}
		if (boilerData.pressure > 0) {
			boilerData.pressure -= 0.5;
			if (boilerData.pressure < 0) {
				boilerData.pressure = 0;
			}
		}

		boilerData.write();
	}

	core.register_node("crafter_steam:boiler", {
		drawtype: Drawtype.mesh,
		mesh: "steam_boiler.gltf",
		tiles: ["steam_boiler.png"],
		paramtype2: ParamType2["4dir"],
		groups: {
			stone: 1,
			pathable: 1,
			steam: 1,
			water_vessel: 1,
			heat_vessel: 1,
		},
		sounds: crafter.stoneSound(),

		on_rightclick(position, node, clicker, itemStack, pointedThing) {
			if (clicker == null) {
				return;
			}
			const itemName = itemStack.get_name();

			if (itemName != "crafter:bucket_water") {
				return;
			}

			//? Adding water.

			const boilerData = utility.getMeta(position, BoilerMeta);

			// Can't add water if the boiler is full..
			if (boilerData.waterLevel >= 100) {
				return;
			}
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
