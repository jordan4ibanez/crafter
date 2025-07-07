# defaults to linux, expects you to already have made the debugging world.
# @./scripts/clean_build_dir.sh
# @./scripts/compile_game.sh

defaults:
	@node --no-warnings=ExperimentalWarning ts_lua_project_bridge.ts
	@echo Starting Luanti.
	@luanti --go --gameid crafter --worldname $$HOME/.minetest/worlds/debugging

assets:
	@node --no-warnings=ExperimentalWarning ts_lua_project_bridge.ts --copy-media


watch:
	@npx tstl --watch

clean:
	@node --no-warnings=ExperimentalWarning ts_lua_project_bridge.ts --rebuild-code --copy-media



release:
	@node --no-warnings=ExperimentalWarning ts_lua_project_bridge.ts --create-release

# clean:
# 	@echo Destroying the built game.
# 	@rm --verbose -rf mods/

optimize_pngs:
	@./scripts/optimize_pngs.sh