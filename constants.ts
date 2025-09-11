import { Style, AspectRatio } from './types';
import { 
    IconAspectSquare,
    IconAspectWidescreen,
    IconAspectSocial,
    IconAspectTraditional,
    IconAspectClassic,
    IconPhoto
} from './components/Icons';

export const ART_STYLES: Style[] = [
    { category: "Core", name: "No style", prompt: "[input.description]" },
    { category: "Core", name: "Realistic images", prompt: "[input.description], high quality image, 4k, 8k, HD, UHD, Sharp Focus, In Frame" },
    { category: "Core", name: "Realistic humans", prompt: "[input.description], high quality image, 4k, 8k, HD, UHD" },
    { category: "Core", name: "Anti-NSFW", prompt: "[input.description], SFW" },
    { category: "Core", name: "No Human (cannot filter 100%)", prompt: "[input.description]" },

    { category: "Anime & Cartoon", name: "Hazbin Hotel", prompt: "([input.description]) (one character:1.5),(Hazbin Hotel Art Style:1.3), (Animated Series Art Style:1.3), (Anime Art style:1.3), (bright color grading:1.2), (vibrant color grading:1.2), (light leaks), (lens flare)" },
    { category: "Anime & Cartoon", name: "League of Legends", prompt: "[input.description], fyptt.toconcept art, digital art, illustration, (league of legends style concept art), inspired by wlop style, 8k, fine details, sharp, very detailed, high resolution,anime, (realistic) ,magic the gathering, colorful background, no watermark,wallpaper, normal eyes" },
    { category: "Anime & Cartoon", name: "Dragonball", prompt: "([input.description]), (Dragonball Anime Art Style:1.1), (YuGiOh art style:1.3), (bright color grading:1.2), (vibrant color grading:1.2), (light leaks), (lens flare)" },
    { category: "Anime & Cartoon", name: "ENA", prompt: "([input.description]), (AND NEW GAME created by Peruvian animator Joel Guerra art style:1.3), (Surrealist crossed with Late 90s and Early 2000s Computer software and obscure console gaming imagery art style:1.3), (bright color grading:1.2)" },
    { category: "Anime & Cartoon", name: "Neko (Catgirl)", prompt: "[input.description] (((one character:1.5))), (human catgirl with a cat tail anime art style:1.3), (waifu anime art style:1.3), (gorgeous anime art style:1.3), (yugioh art style:1.3), (2d disney character art style:1.1), (catgirl anime art style:1.3), (neko anime art style:1.3), (vibrant color grading:1.6), (bright color grading:1.6), adult female catgirl, perfect body, {dark|light|medium} skin complexion, pretty lips, pretty eyes, light makeup, ({character portrait|high-angle shot|low-angle shot|close up shot|over-the-shoulder shot|wide-angle shot|profile shot|full body shot|telephoto shot|panoramic shot|handheld shot}:1.3)" },
    { category: "Anime & Cartoon", name: "American Girl", prompt: "[input.description] (((one character:1.5))), (perfect gorgeous anime art style:1.3), (yugioh art style:1.3), (2d disney character art style:1.3), (gen13 comic art style), (stormwatch comic art style), tall adult female in her early 20s, perfect body, {dark|light|medium} skin complexion, smooth skin, american face, pretty lips, pretty eyes, light makeup, (wearing {jeans|short shorts|a revealing outfit|a skin-tight bodysuit|a punk rock outfit|a steampunk outfit|a college cheerleader uniform|a skater girl outfit|a swimsuit|a bikini|underwear and a t-shirt with no bra|fancy underwear|a minidress with stockings|a miniskirt with stockings|leggings}:1.2), (view from {the front|behind}), ({character portrait|high-angle shot|low-angle shot|close up shot|over-the-shoulder shot|wide-angle shot|profile shot|full body shot|telephoto shot|panoramic shot|handheld shot}:1.3)" },
    { category: "Anime & Cartoon", name: "My Little Pony Kawaii", prompt: "[input.description], (My Little Pony Art Style:1.3), (Furry Art Style:1.3), (Cute Kawaii Art Style:1.5), ((cute)), (cool color grading:1.5)" },
    { category: "Anime & Cartoon", name: "My Little Pony Anime", prompt: "[input.description], (My Little Pony Art Style:1.3), (Furry Art Style:1.3), (Cute Anime Art Style:1.5), ((cute))" },
    { category: "Anime & Cartoon", name: "Hello Kitty", prompt: "[input.description], Hello Kitty,  (((adorable, cute, kawaii)), cute moe portrait, adorable, kawaii moé masterpiece, cuteness overload, very detailed, sooooo adorable!!!, absolute masterpiece" },
    
    { category: "Video Games", name: "Terraria", prompt: "([input.description]), (Terrarria Art Style:1.3), (Pixel Art Style:1.3), (Vibrant Color Grading:1.3)" },
    { category: "Video Games", name: "Final Fantasy", prompt: "([input.description]), (Final Fantasy Art Style:1.3), (CGI Video Game Art Style:1.3), (3D Video Game Art Style:1.3), (light leaks:1.1), (lens flare:1.1)" },
    { category: "Video Games", name: "Star Wars Character", prompt: "([input.description]), (((one character:1.5))),(Star Wars Art Style:1.3), (Animated Star Wars Art style:1.3), (Star Wars Anime Art style:1.3), (Anime Art style:1.3), (bright color grading:1.2), (vibrant color grading:1.2), (light leaks), (lens flare)" },
    { category: "Video Games", name: "Star Wars Battle", prompt: "([input.description]), (((epic space battle:1.5))),(Star Wars Space Battle Art Style:1.3), (Animated Star Wars Art style:1.3), (Space Battle Anime Art style:1.3), (Anime Art style:1.3), (Starship Battle Art Style:1.3), (bright color grading:1.2), (vibrant color grading:1.2), (light leaks), (lens flare)" },
    { category: "Video Games", name: "Undertale", prompt: "([input.description]), (Undertale Anime Art Style:1.3)" },
    { category: "Video Games", name: "Lego", prompt: "([input.description]), (legos art style:1.3), (lego video game art style:1.3)" },
    { category: "Video Games", name: "MTG Card", prompt: "magic the gathering card [input.description]" },
    
    { category: "Gems & Materials", name: "Topaz", prompt: "([input.description]), (topaz:1.5), (shiny:1.3), (fancy:1.2)" },
    { category: "Gems & Materials", name: "Sapphire", prompt: "([input.description]), (sapphires:1.5), (shiny:1.4), (fancy:1.2)" },
    { category: "Gems & Materials", name: "Emerald", prompt: "([input.description]), (emeralds:1.5), (shiny:1.3), (fancy:1.2)" },
    { category: "Gems & Materials", name: "Opal", prompt: ", (opals:1.5), (shiny:1.3), (fancy:1.2)" },
    { category: "Gems & Materials", name: "Garnet", prompt: "([input.description]), (garnet:1.5), (shiny:1.3), (fancy:1.2)" },
    { category: "Gems & Materials", name: "Amethyst", prompt: ", (amethyst:1.5), (shiny:1.3), (fancy:1.2)" },
    { category: "Gems & Materials", name: "Ruby", prompt: "([input.description]), (rubies:1.5), (shiny:1.3), (fancy:1.2)" },
    { category: "Gems & Materials", name: "Diamond", prompt: "([input.description]), (diamonds:1.3), (shiny:1.3), (fancy:1.2)" },
    { category: "Gems & Materials", name: "Lapis Lazuli", prompt: "([input.description]), (lapiz lazuli:1.5), (shiny:1.3), (fancy:1.2)" },
    { category: "Gems & Materials", name: "Aquamarine", prompt: "([input.description]), (aquamarine:1.5), (shiny:1.3), (fancy:1.2)" },
    { category: "Gems & Materials", name: "Peridot", prompt: "([input.description]), (peridot:1.5), (shiny:1.3), (fancy:1.2)" },
    { category: "Gems & Materials", name: "Pearl", prompt: "([input.description]), (pearl:1.5), (shiny:1.3), (fancy:1.2)" },
    { category: "Gems & Materials", name: "Jade", prompt: "([input.description]), (jade:1.5), (shiny:1.3), (fancy:1.2)" },
    { category: "Gems & Materials", name: "Citrine", prompt: "([input.description]), (citrine:1.5), (shiny:1.3), (fancy:1.2)" },
    { category: "Gems & Materials", name: "Quartz", prompt: "([input.description]), (quartz:1.5), (shiny:1.3), (fancy:1.2)" },
    { category: "Gems & Materials", name: "Jasper", prompt: "([input.description]), (jasper:1.5), (shiny:1.3), (fancy:1.2)" },
    { category: "Gems & Materials", name: "Rose Quartz", prompt: "([input.description]), (rose quartz:1.5), (shiny:1.3), (fancy:1.2)" },
    { category: "Gems & Materials", name: "Crystals", prompt: "[input.description], (Crystals:1.5), (Gemstones:1.3), (Shiny), (Reflective), (Fancy)" },
    { category: "Gems & Materials", name: "Silver", prompt: "[input.description], (silver:1.5), (shiny:1.3), (reflective:1.3), (magical:1.3)" },
    { category: "Gems & Materials", name: "Gold", prompt: "[input.description], (gold:1.5), (shiny:1.3), (reflective:1.3), (magical:1.3)" },
    { category: "Gems & Materials", name: "Platinum", prompt: "[input.description], (platinum:1.5), (shiny:1.3), (reflective:1.3), (magical:1.3)" },

    { category: "Fantasy & Abstract", name: "Outer Space", prompt: "([input.description]) (Outer Space:1.3), Nebula, (Galaxies:1.3), (Stars:1.5), (planets:1.3), (cool color grading:1.4)" },
    { category: "Fantasy & Abstract", name: "Witchcraft", prompt: "[input.description], (Witchcraft:1.5), ({magic:1.5|spells:1.5|wands:1.5|herbs:1.5|spell books:1.5}), (Black Magic:1.3), (Incantations:1.3), (potions:1.3), (herbs:1.5), (Spell Books:1.3), (Wands:1.5), (warm color grading:1.5)" },
    { category: "Fantasy & Abstract", name: "Kawaii Witchcraft", prompt: "[input.description], (Witchcraft:1.5), (black magic:1.3), (Incantations:1.3), (potions.1.3), (herbs:1.5) (Spell Books:1.3), (Wands:1.5),  (((adorable, cute, kawaii)), cute moe anime character portrait, adorable, featured on pixiv, kawaii moé masterpiece, cuteness overload, very detailed, sooooo adorable!!!, absolute masterpiece" },
    { category: "Fantasy & Abstract", name: "Moonstone's Wonderland", prompt: "([input.description]), (moonstones:1.3), (stardust:1.5), (cotton candy:1.3), (pine needles:1.3), (lakes:1.5), (licorice:1.3), (rainbows:1.3), (mint:1.5), (unicorn poo:1.3), and (glittery berries:1.3)" },
    { category: "Fantasy & Abstract", name: "Unicorn", prompt: "[input.description], (Unicorn:1.3), (Furry Art Style:1.5), (Glitter), Magic, Sparkles, ((Cute))" },
    { category: "Fantasy & Abstract", name: "Hell", prompt: "[input.description], (Hell:1.3), (Fire), (Lava), (Death), (Demonic:1.3)" },
    { category: "Fantasy & Abstract", name: "Demon Anime", prompt: "[input.description], (Demon:1.3), (Devil Wings:1.5), (Devil Horns:1.3), (anime art:1.2), masterpiece, 4k, best quality, anime art" },
    { category: "Fantasy & Abstract", name: "Angel Anime", prompt: "[input.description], (Angel:1.3), (Angel Wings:1.5), (halo:1.3), (anime art:1.2), masterpiece, 4k, best quality, anime art" },
    { category: "Fantasy & Abstract", name: "Webcore", prompt: "([input.description]), (bold colors made in MS Paint and retro graphic design art style:1.3), (pixel art style:1.3), (neon color grading:1.2)" },
    { category: "Fantasy & Abstract", name: "Tiled Mosaic", prompt: "[input.description], (tiled mosaic, art, tilling, made of tiles:1.4)" },

    { category: "Food & Nature", name: "Skittles", prompt: "([input.description]), (skittles art style:1.3), (taste the rainbow art style:1.3), skittles, tropical skittles, sour skittles, neon color grading, bright color grading, vibrant color grading, light leaks, lens flare, long exposure" },
    { category: "Food & Nature", name: "Rose", prompt: "([input.description]) (red roses:1.3), (white roses:1.3), (red rose petals:1.5), (white rose petals:1.5), beautiful, magical, lovely" },
    { category: "Food & Nature", name: "Lavender", prompt: "([input.description]), (lavenders:1.3), (lavender petals:1.5), beautiful, fancy, magical" },
    { category: "Food & Nature", name: "Flowers", prompt: "[input.description], (flowers:1.5), (flower petals:1.3), pollen, leaves, (bright color grading:1.3)" },
    { category: "Food & Nature", name: "Cotton Candy", prompt: "[input.description], (Cotton:1.3), (Pink:1.5), (Blue:1.5), (Yellow:1.5), (bright color grading:1.3)" },
    { category: "Food & Nature", name: "Donuts", prompt: "[input.description], (Donut:1.3), (Sprinkles:1.5), (Frosting:1.3), (Glazed)" },
    { category: "Food & Nature", name: "Cupcake", prompt: "[input.description], (cupcakes:1.5), (sprinkles:1.3), (frosting:1.3), (pastel color grading:1.3)" },
    { category: "Food & Nature", name: "Cake", prompt: "[input.description], (cakes:1.5), (sprinkles:1.3), (frosting:1.3), (elaborate:1.3), (fancy designs:1.5), (cool color grading:1.3)" },
    { category: "Food & Nature", name: "Pie", prompt: "[input.description], ({blueberries:1.3|apples:1.3|peaches:1.3|strawberries:1.3}), (baked pie:1.5), (baked:1.3), steam, hot, (delicious:1.3), (tasty:1.3)" },
    
    { category: "NSFW", name: "𝐍𝐒𝐅𝐖 - 𝐑𝐞𝐚𝐥𝐢𝐬𝐭𝐢𝐜", prompt: "[input.description], highly realistic, realistic portrait, (nsfw), anatomically correct, realistic photograph, real colors, award winning photo, detailed face, realistic eyes, beautiful, sharp focus, high resolution, volumetric lighting, incredibly detailed, masterpiece, breathtaking, exquisite, great attention to skin and eyes" },
    { category: "NSFW", name: "𝐍𝐒𝐅𝐖 - 𝐀𝐧𝐢𝐦𝐞", prompt: "[input.description], intricate detail, hyper-anime, trending on artstation, 8k, fluid motion, stunning shading, anime, highly detailed, realistic, (nsfw), dramatic lighting, beautiful, animation, sharp focus, award winning, masterpiece, cinematic, dynamic, cinematic lighting, breathtaking, exquisite, great attention to skin and eyes, exceptional, exemplary, unsurpassed, viral, popular, buzzworthy, up-and-coming, emerging, promising, acclaimed, premium" },
    { category: "NSFW", name: "𝐍𝐒𝐅𝐖 - 𝐑𝐞𝐚𝐥𝐢𝐬𝐭𝐢𝐜 (Stronger)", prompt: "[input.description], highly realistic, realistic portrait, (((nsfw))), anatomically correct, realistic photograph, real colors, award winning photo, detailed face, realistic eyes, beautiful, sharp focus, high resolution, volumetric lighting, incredibly detailed, masterpiece, breathtaking, exquisite, great attention to skin and eyes" },
    { category: "NSFW", name: "𝐍𝐒𝐅𝐖 - 𝐀𝐧𝐢𝐦𝐞 (Stronger)", prompt: "[input.description], intricate detail, hyper-anime, trending on artstation, 8k, fluid motion, stunning shading, anime, highly detailed, realistic, (((nsfw))), dramatic lighting, beautiful, animation, sharp focus, award winning, masterpiece, cinematic, dynamic, cinematic lighting, breathtaking, exquisite, great attention to skin and eyes, exceptional, exemplary, unsurpassed, viral, popular, buzzworthy, up-and-coming, emerging, promising, acclaimed, premium" },
    { category: "NSFW", name: "Sexy Furry", prompt: "([input.description]), anthro nude sexy girl 3d model, modern yiff style, octane 3d render illustration, hand-drawn, bold linework, anthro illustration, cel shaded, 4k, fine details, masterpiece anthro nude sexy girl 3d model, modern yiff style, octane 3d render illustration, hand-drawn, bold linework, anthro illustration, cel shaded, 4k, fine details, masterpiece" },
];

export const ART_STYLES_2: Style[] = [
    { category: "Core", name: "No style", prompt: "" },
    ...ART_STYLES.filter(s => s.name !== 'No style').map(s => ({...s, prompt: s.prompt.replace('[input.description],','').replace('[input.description]','') }))
];

export const COLORS: { [key: string]: string } = {
    'none': '', 'white': '(white:1.5)', 'brown': '(brown:1.5)', 'periwinkle': '(periwinkle:1.5)',
    'green': '(green:1.5)', 'violet': '(violet:1.5)', 'iridescentwhite': '(iridescent:1.5) (white:1.5)',
    'pink': '(pink:1.5)', 'cyan': '(cyan:1.5)', 'turquoise': '(turquoise:1.5)', 'stars': '(stars:1.5)',
    'red': '(red:1.5)', 'yellow': '(yellow:1.5)', 'orange': '(orange:1.5)', 'snow': '(snow:1.5)',
    'magenta': '(magenta:1.5)', 'black': '(black:1.5)', 'fuschia': '(fuschia:1.5)', 'teal': '(teal:1.5)',
    'silver': '(silver:1.5)', 'platinum': '(platinum:1.5)', 'aquamarine': '(aquamarine:1.5)',
    'brass': '(brass:1.5)', 'mint': '(mint green:1.5)', 'navy blue': '(navy blue:1.5)', 'maroon': '(maroon:1.5)',
    'sea foam green': '(sea foam green:1.5)', 'indigo': '(indigo:1.5)', 'ivory': '(ivory:1.5)',
    'azure': '(azure:1.5)', 'blue': '(blue:1.5)', 'rose quartz': '(rose quartz:1.5)', 'sky blue': '(sky blue:1.5)',
    'mediterranian green': '(mediterranean green:1.5)', 'gold': '(gold:1.5)', 'beige': '(beige:1.5)'
};

export const EXTRA_COLORS: { [key: string]: string } = {
    'none': '.', 'bright': '(bright color grading:1.5)', 'cool': '(cool color grading:1.5)',
    'duotone': '(duotone color grading:1.5)', 'monochrome': '(monochrome color grading:1.5)',
    'muted': 'muted colors', 'neon': '(neon color grading:1.5)', 'oversaturated': 'oversaturated colors',
    'pastel': '(pastel color grading:1.5)', 'sterile': '(cool-toned sterile color grading:1.5)',
    'vibrant': '(vibrant color grading:1.5)', 'warm': '(warm color grading:1.5)',
    'washed out': '(washed out color grading:1.5)'
};

export const NUM_IMAGES_OPTIONS = [1, 2, 3, 4];

export const GUIDANCE_OPTIONS = [
  { value: 3, label: '3 (Creative)' },
  { value: 5, label: '5 (Balanced)' },
  { value: 7, label: '7 (Default)' },
  { value: 10, label: '10 (Precise)' },
  { value: 15, label: '15 (Strict)' },
];

export const ASPECT_RATIO_OPTIONS: { value: AspectRatio; ratio: string; description: string; Icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
    { value: 'source', ratio: 'Source', description: 'Keep original', Icon: IconPhoto },
    { value: '1:1', ratio: '1:1', description: 'Square', Icon: IconAspectSquare },
    { value: '16:9', ratio: '16:9', description: 'Widescreen', Icon: IconAspectWidescreen },
    { value: '9:16', ratio: '9:16', description: 'Social story', Icon: IconAspectSocial },
    { value: '3:4', ratio: '3:4', description: 'Traditional', Icon: IconAspectTraditional },
    { value: '4:3', ratio: '4:3', description: 'Classic', Icon: IconAspectClassic },
];

export const RANDOM_PROMPTS = [
    'portrait of a cyborg-woman, servant of the underworld',
    'a cute cat x dog hybrid, pokemon-like creature',
    'magical mermaid exploring a coral reef',
    'steampunk explorer with an airship',
    'neon cityscape during a rainstorm',
    'enchanted forest guarded by giant mushrooms',
    'a photo of an astronaut riding a horse on Mars',
    'make @img1 cyberpunk',
    'add a dragon flying in the sky of @img1',
    'change the season in @img1 to winter',
    'render @img1 in the style of @style',
    'make the subject of @img1 smile'
];