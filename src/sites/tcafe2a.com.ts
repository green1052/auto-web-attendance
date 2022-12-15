import {Module} from "../index";
import * as cheerio from "cheerio";

export default {
    name: "tcafe2a.com",
    auth: "cookie",
    async start(client, auth) {
        client.defaults.baseURL = "https://tcafe2a.com";
        client.defaults.headers.common = {
            "Cookie": auth.value as string,
            "Accept-Encoding": "gzip, deflate, compress"
        };

        try {
            const response = await client.get("/community/attendance");
            const $ = cheerio.load(response.data);
            const secdoe = $("input[name=secdoe]").val() as string | undefined;

            if (secdoe === undefined) {
                return {
                    success: false,
                    error: "secdoe is undefined"
                }
            }

            const params = new URLSearchParams();
            params.set("secdoe", secdoe);
            params.set("proctype", "gogogo");

            const response2 = await client.post("/attendance/selfattend2_p.php", {
                secdoe,
                proctype: "gogogo"
            });

            const $2 = cheerio.load(response2.data);

            return {
                success: true,
                message: $2(".board-head:eq(1)").text().trim() || "Failed to parse message but attendance succeeded."
            };
        } catch (e) {
            return {
                success: false,
                message: e
            }
        }
    }
} as Module;