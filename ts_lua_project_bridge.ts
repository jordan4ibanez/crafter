import * as FS from "node:fs";
import * as Exec from "node:child_process";
import Zip from "jszip";

//? Check if the project should be fully rebuilt.
const [REBUILD_CODE, COPY_MEDIA, CREATE_RELEASE] = (() => {
	let rebuild: boolean = false;
	let copyMedia: boolean = false;
	let createRelease: boolean = false;

	// Certain scenarios need to be captured.
	const args = process.argv.slice(2);
	if (!args) return [false, false, false];
	if (args.length == 0) return [false, false, false];

	// Now let's see if we have some arguments.
	args.forEach((arg: string) => {
		if (arg === "--rebuild-code") {
			rebuild = true;
		} else if (arg === "--copy-media") {
			copyMedia = true;
		} else if (arg === "--create-release") {
			rebuild = true;
			copyMedia = true;
			createRelease = true;
		}
	});

	return [rebuild, copyMedia, createRelease];
})();

//? Remove the mods directory and recompile the entire program.
//~ Only if specified.
if (REBUILD_CODE) {
	FS.rmSync("mods/", { recursive: true, force: true });
	Exec.execSync("npx tstl");
}

//? Copy media assets into the build.
//~ Only if specified.
if (COPY_MEDIA) {
	const acceptableExtensions = new Set<string>([
		"png",
		"ogg",
		"b3d",
		"x",
		"obj",
		"gltf",
		"mts",
	]);
	["models", "sounds", "schematics", "textures"].forEach((id: string) => {
		FS.cpSync(`source/${id}/${id}`, `mods/${id}/${id}`, {
			recursive: true,
			filter: (source: string) => {
				const thisData: FS.Stats = FS.lstatSync(source);
				if (thisData.isDirectory()) {
					return true;
				}

				const extension: string | undefined = source.split(".").pop();

				// I do not know how this would happen, but I would like to be informed.
				if (extension === undefined) {
					console.warn(`Undefined extension: [${source}]`);
					return false;
				}

				// Make sure the sublicenses get copied over.
				if (extension.endsWith("LICENSE")) {
					return true;
				}

				// Predefined acceptable media has been reached.
				if (acceptableExtensions.has(extension)) {
					return true;
				}

				//? This is kept here as a debugging tool.
				// console.log(extension);

				return false;
			},
		});
	});
}

//? Copy the config files.
//! Always runs.
FS.readdirSync("source/", { recursive: false }).forEach(
	(item: string | Buffer) => {
		// Basic checks to make sure nothing explodes.
		if (item instanceof Buffer) {
			return;
		}
		if (!FS.statSync(`source/${item}`).isDirectory()) {
			return;
		}

		if (!FS.existsSync(`source/${item}/mod.conf`)) {
			throw new Error(`mod ${item} is missing a mod.conf!`);
		}
		// So now, if the folder doesn't exist it needs to be made.
		if (!FS.existsSync(`mods/${item}`)) {
			FS.mkdirSync(`mods/${item}`);
		} else {
			// If a file is accidentally put in the mods folder during testing, this needs manual intervention.
			if (!FS.statSync(`source/${item}`).isDirectory())
				throw new Error(`mod ${item} is a file in the mods folder!`);
		}
		FS.copyFileSync(`source/${item}/mod.conf`, `mods/${item}/mod.conf`);
	}
);

//? Create a release zip file for this to be deployed on github.
//~ This is the most time consuming option.
if (CREATE_RELEASE) {
	const versionInfo: string = (() => {
		let gottenInfoData: string | null = null;

		for (const line of FS.readFileSync(
			"./source/crafter/init.ts",
			"utf-8"
		).split("\n")) {
			if (line.trim().startsWith("export const version: string = ")) {
				const foundData: string[] = line.split(" ");

				gottenInfoData = foundData[foundData.length - 1]
					.slice(0, -1)
					.replaceAll('"', "");
				break;
			}
		}
		if (gottenInfoData === null) {
			throw new Error("Could not find version info!");
		}
		return gottenInfoData;
	})();

	const buildFolder: string = "crafter_build/";
	const releaseOutputFolder: string = "release_build/";

	// Set up the release build folder.
	console.log(`Creating [${versionInfo}] release.`);

	// Remove the old release folder and create a new one.
	if (FS.existsSync(releaseOutputFolder)) {
		console.log("Removing old release output folder.");
		FS.rmSync(releaseOutputFolder, { recursive: true, force: true });
	}

	FS.mkdirSync(releaseOutputFolder);

	// Remove the old build folder and create a new one.
	if (FS.existsSync(buildFolder)) {
		console.log("Removing old build folder.");
		FS.rmSync(buildFolder, { recursive: true, force: true });
	}

	FS.mkdirSync(buildFolder);

	// Now copy...

	// mods/ folder.
	FS.cpSync(`mods/`, `${buildFolder}mods/`, { recursive: true });
	// menu/ folder.
	FS.cpSync(`menu/`, `${buildFolder}menu/`, { recursive: true });
	// readme.MD
	FS.cpSync(`readme.MD`, `${buildFolder}readme.MD`);
	// LICENSE
	FS.cpSync(`LICENSE`, `${buildFolder}LICENSE`);
	// game.conf
	FS.cpSync(`game.conf`, `${buildFolder}game.conf`);

	// Then make a zip.
	const zip: Zip = new Zip();

	FS.readdirSync(buildFolder, { recursive: true }).forEach(
		(item: string | Buffer) => {
			// Basic checks to make sure nothing explodes.
			if (!item) return;
			if (item instanceof Buffer) return;
			if (typeof item === "object") return;
			// And raw copying.
			const current: string = `${buildFolder}${item}`;
			if (!FS.statSync(current).isDirectory()) {
				zip.file(current, FS.readFileSync(current));
			}
		}
	);

	zip.generateAsync({ type: "blob" }).then((content: Blob) => {
		content.arrayBuffer().then((data: ArrayBuffer) => {
			FS.writeFileSync(
				`release_build/crafter_release_${versionInfo}.zip`,
				new DataView(data)
			);
		});
	});

	// todo: create a tar.gz creator, or not. tar czf crafter_release.tar.gz crafter_release/

	// And finally, remove the build folder.
	if (FS.existsSync(buildFolder)) {
		FS.rmSync(buildFolder, { recursive: true, force: true });
		console.log("Completed.");
	}
}
