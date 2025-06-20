namespace drowning {
	export interface DrownData {
		breath: number;
		ticker: number;
		drowning: number;
	}

	const mod_storage: MetaRef = core.get_mod_storage();
	const pool = new Map<string, DrownData>();

	// updates bubble bar
	function update_breath_bar(player: ObjectRef, breath: number): void {
		if (breath > 20) {
			if (hudManager.hud_exists(player, "breath_bg")) {
				hudManager.remove_hud(player, "breath_bg");
			}
			if (hudManager.hud_exists(player, "breath")) {
				hudManager.remove_hud(player, "breath");
			}
		} else {
			if (!hudManager.hud_exists(player, "breath_bg")) {
				hudManager.add_hud(player, "breath_bg", {
					type: HudElementType.statbar,
					position: { x: 0.5, y: 1 },
					text: "bubble_bg.png",
					number: 20,
					direction: 1,
					size: { x: 24, y: 24 },
					offset: { x: 24 * 10, y: -(48 + 52 + 39) },
				});
			}
			if (!hudManager.hud_exists(player, "breath")) {
				hudManager.add_hud(player, "breath", {
					type: HudElementType.statbar,
					position: { x: 0.5, y: 1 },
					text: "bubble.png",
					number: breath,
					direction: 1,
					size: { x: 24, y: 24 },
					offset: { x: 24 * 10, y: -(48 + 52 + 39) },
				});
			}
			hudManager.change_hud({
				player: player,
				hudName: "breath",
				element: "number",
				data: breath,
			});
		}
	}

	// Loads data from mod storage.
	function load_data(player: ObjectRef): void {
		const name: string = player.get_player_name();

		const data: DrownData = {
			breath: 0,
			ticker: 0,
			drowning: 0,
		};

		if (mod_storage.get_int("crafter_drown_" + name + "_save") > 0) {
			data.breath = mod_storage.get_float(
				"crafter_drown_" + name + "breath"
			);
			data.ticker = mod_storage.get_float(
				"crafter_drown_" + name + "breath_ticker"
			);
			data.drowning = mod_storage.get_float(
				"crafter_drown_" + name + "drowning"
			);
		} else {
			data.breath = 21;
			data.ticker = 0;
			data.drowning = 0;
		}

		pool.set(name, data);
	}

	// Saves data to be utilized on next login.
	function save_data(name: string): void {
		const data: DrownData | undefined = pool.get(name);

		if (data == null) {
			throw new Error(`Player [${name}] drown data does not exist.`);
		}

		mod_storage.set_float("crafter_drown_" + name + "breath", data.breath);
		mod_storage.set_float(
			"crafter_drown_" + name + "breath_ticker",
			data.ticker
		);
		mod_storage.set_float(
			"crafter_drown_" + name + "drowning",
			data.drowning
		);
		mod_storage.set_int("crafter_drown_" + name + "_save", 1);

		pool.delete(name);
	}

	// Is used for shutdowns to save all data.
	function save_all(): void {
		for (const name of pool.keys()) {
			save_data(name);
		}
	}

	// Remove stock health bar.

	core.hud_replace_builtin(HudReplaceBuiltinOption.breath, {
		type: HudElementType.statbar,
		position: { x: 0, y: 0 },
		text: "nothing.png",
		number: 0,
		direction: 0,
		size: { x: 0, y: 0 },
		offset: { x: 0, y: 0 },
	});

	core.register_on_joinplayer((player: ObjectRef) => {
		load_data(player);
		player.hud_set_flags({ breathbar: false });
	});

	// Saves specific users data for when they relog.
	core.register_on_leaveplayer((player: ObjectRef) => {
		save_data(player.get_player_name());
	});

	// Save all data to mod storage on shutdown.
	core.register_on_shutdown(() => {
		save_all();
	});

	export function is_player_drowning(player: ObjectRef): boolean {
		const name: string = player.get_player_name();
		const data: DrownData | undefined = pool.get(name);
		if (data == null) {
			throw new Error(`Player [${name}] has no drowning data.`);
		}

		return data.drowning > 0;
	}

	// Reset the player's data.
	core.register_on_respawnplayer((player: ObjectRef) => {
		const name: string = player.get_player_name();
		const data: DrownData | undefined = pool.get(name);
		if (data == null) {
			throw new Error(`Player [${name}] has no drowning data.`);
		}
		data.breath = 21;
		data.ticker = 0;
		data.drowning = 0;
		update_breath_bar(player, data.breath);
	});

	// Handle the breath bar.
	function handle_breath(player: ObjectRef, dtime: number): void {
		const name: string = player.get_player_name();

		const head: string | null = playerMechanics.get_player_head_env(player);

		const data: DrownData | undefined = pool.get(name);

		if (data == null) {
			throw new Error(`Player [${name}] has no drowning data.`);
		}

		const hp: number = player.get_hp();
		if (hp <= 0) {
			return;
		}

		if (head != null && core.get_item_group(head, "drowning") > 0) {
			data.ticker += dtime;
			if (data.breath > 0 && data.ticker >= 1.3) {
				if (data.breath == 21) {
					data.breath = 20;
				}
				data.breath -= 2;
				data.drowning = 0;
				update_breath_bar(player, data.breath);
			} else if (data.breath <= 0 && data.ticker >= 1.3) {
				data.drowning = 1;
				if (hp > 0) {
					player.set_hp(hp - 2, { type: HPChangeReasonType.drown });
				}
			}
			if (data.ticker >= 1.3) {
				data.ticker = 0;
			}
		} else {
			data.ticker += dtime;
			if (data.breath < 21 && data.ticker >= 0.25) {
				data.breath += 2;
				data.drowning = 0;
				data.ticker = 0;
				update_breath_bar(player, data.breath);
			}
		}
	}

	// Inject into main loop.
	core.register_globalstep((dtime: number) => {
		for (const [_, player] of ipairs(core.get_connected_players())) {
			handle_breath(player, dtime);
		}
	});
}
