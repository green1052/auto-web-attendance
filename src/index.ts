import fs from "fs";
import TSON from "typescript-json";
import * as process from "process";
import * as path from "path";
import axios, {AxiosInstance} from "axios";
import cron from "node-cron";

export interface Module {
    name: string;
    auth: "cookie" | "password" | "both";

    start(client: AxiosInstance, auth: ModuleAuth): Promise<ModuleResult>;
}

interface ModuleAuth {
    type: "cookie" | "password";
    value: string;
}

interface ModuleResult {
    success: boolean;
    error?: string;
    message?: string;
}

interface Site {
    name: string;
    timezone?: string;
    cron?: string;
    cookie?: string;
    username?: number;
    password?: string;
}

interface Config {
    timezone: string;
    cron: string;
    sites: Site[];
}

const config =
    fs.existsSync("./config/config.json")
        ? JSON.parse(fs.readFileSync("./config/config.json", "utf8"))
        : process.env.config;

if (!TSON.is<Config>(config)) {
    console.error("Invalid config.json");
    process.exit(-1);
}

const modules = new Map<string, Module>;

const basePath = path.join(__dirname, "sites");

for (const site of fs.readdirSync(basePath).filter(file => file.endsWith(".js") || file.endsWith(".ts"))) {
    const func: Module = require(path.join(basePath, site)).default;
    modules.set(func.name, func);
    console.log(`[Module]: ${func.name} Loaded`);
}

const client = axios.create({
    headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; rv:107.0) Gecko/20100101 Firefox/107.0"
    }
});

console.log();

for (const site of config.sites) {
    const module = modules.get(site.name);

    if (module === undefined) {
        console.error(`Invalid site name: ${site.name}`);
        continue;
    }

    let auth: "cookie" | "password";

    if ((module.auth === "both" || module.auth === "password") && site.password !== undefined) {
        auth = "password";
    } else if ((module.auth === "both" || module.auth === "cookie") && site.cookie !== undefined) {
        auth = "cookie";
    } else {
        console.error(`Invalid auth for ${site.name}`);
        continue;
    }

    cron.schedule(site.cron ?? config.cron, async () => {
        const result = await module.start(client, {
            type: auth,
            value: auth === "cookie" ? site.cookie! : site.password!
        });

        if (result.success) {
            console.log(`[${module.name}]: ${result.message ?? "Success the task"}`);
        } else {
            console.error(`[${module.name}]: ${result.error ?? "Failed the task"}`);
        }
    }, {
        timezone: site.timezone ?? config.timezone
    });

    console.log(`[${module.name}]: Task Registered`);
}