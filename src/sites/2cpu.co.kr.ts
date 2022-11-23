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
        client.defaults.headers.common = {
            "Cookie": auth.value
        };

        try {
            const response = await client.post("https://www.2cpu.co.kr/plugin/attendance/attendance_update.php", `s_date=${DateTime.now().setZone("Asia/Seoul").toFormat("yyyy-MM-dd")}&currentId=&at_type=${getRandomInt(1, 3)}&at_memo=%BF%C0%B4%C3%C0%BA+%B2%C0%C0%CC%B1%E6%C5%D7%B4%D9%21%21`, {
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