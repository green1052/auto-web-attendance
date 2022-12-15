import {Module} from "../index";
import iconv from "iconv-lite";
import {DateTime} from "luxon";

function getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

export default {
    name: "2cpu.co.kr",
    auth: "cookie",
    async start(client, auth) {
        client.defaults.baseURL = "https://www.2cpu.co.kr";
        client.defaults.headers.common = {
            "Cookie": auth.value as string
        };

        try {
            const params = new URLSearchParams();
            params.set("s_date", DateTime.now().setZone("Asia/Seoul").toFormat("yyyy-MM-dd"));
            params.set("currentId", "");
            params.set("at_type", getRandomInt(1, 3).toString());
            params.set("at_memo", "%BF%C0%B4%C3%C0%BA+%B2%C0%C0%CC%B1%E6%C5%D7%B4%D9%21%21");

            const response = await client.post("/plugin/attendance/attendance_update.php", params, {
                responseType: "arraybuffer"
            });

            const decoded = iconv.decode(response.data, "EUC-KR");

            return {
                success: true,
                message: /alert\('(.*)'\);/g.exec(decoded)?.[1] ?? "Failed to parse message but attendance succeeded."
            };
        } catch (e) {
            return {
                success: false,
                error: e
            };
        }
    }
} as Module;