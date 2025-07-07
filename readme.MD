![Crafter](https://raw.githubusercontent.com/jordan4ibanez/crafter/refs/heads/main/menu/header.png)


# An important note about why you will not find this on contentdb:

This will not be on contentdb as I just don't feel like it. I will perhaps put this in itch.io.

# An important note about why there is no csm anymore:

I don't feel like wasting my time doing the csm as no one can agree on if csm is good or bad. So if you want it, that's tough really.

# An important note about why crafter skindex does not exist anymore:

I don't feel like having to instruct you on how to how to white list the mod. This is not to say I don't understand why this is the case. But I am not going to write a section in this readme or attempt to debug why it doesn't work on different versions.

# An important note about why crafter no longer has redstone:

I don't feel like debugging what is essentially a turing machine in my game. I write this game for free, I write this game for fun. I don't want to waste my time on it. You can perhaps rip the mesecons out of mineclone2 and put it into the game. It is just as good.

### How to compile Crafter:

If you want to mess with this or maybe you would want to use TS for your luanti things.
 
First you need node/nodejs/npm, if you're on ubuntu it's super outdated so go to the nodejs website and install it.

**This is developed with the latest version of nodejs/npm**

Next you need TypeScriptToLua, typescript, and nodejs types.
Also, you need Lua types for TS or else the compiler doesn't know what's going on.
Also also, jszip is for creating a release zip.
```
npm install -D typescript-to-lua typescript @types/node lua-types jszip
```

Next you run ``make clean``.

And if you want to edit the code you can run ``make watch`` in one terminal while continuously running ``make`` every time you want to test things in the engine. If you run make too fast after a change (like I do regularly) it will cause weird problems, so give it a moment to finish.

I HIGHLY recommend you use ``make``. It automates a BUNCH of things. ``make clean`` is for a complete rebuild along with installing new media (images, music, models, etdc).

No make automation scripts created for windows yet though. It's because I don't run windows.

### todos

todo: redo vec2 and vec3 as a TS class instead of the current mess.