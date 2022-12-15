import {Module} from "../index";
import * as cheerio from "cheerio";

interface NovelList {
    title: string;
    url: string;
    chapter: number;
}

export default {
    name: "novelpia.com",
    auth: "cookie",
    async start(client, auth) {
        client.defaults.baseURL = "https://novelpia.com";
        client.defaults.headers.common = {
            "Cookie": auth.value as string
        };

        async function getNovelList(): Promise<NovelList[]> {
            const novelList: NovelList[] = [];

            const response = await client.get("/freestory");
            const $ = cheerio.load(response.data);

            for (const element of $("div.novelbox td.info_st")) {
                const $element = cheerio.load(element);

                const name_st = $element(".name_st");

                const title = name_st.text();
                const url = /location='(.*)'/g.exec(name_st.attr("onclick")!)?.[1];
                const chapter = Number(/(\d*)회차/g.exec($element(".info_t_box").html()!)?.[1]);

                if (!title || !url || isNaN(chapter)) continue;

                novelList.push({
                    title,
                    url,
                    chapter
                });
            }

            return novelList;
        }

        async function getNovelChapter(novelList: NovelList, limit: number): Promise<string[]> {
            const result: string[] = [];

            /** 챕터 페이지 수 (19회차 마다 페이지 수가 달라짐) */
            const chapterCount = Math.round(novelList.chapter / 19);

            for (let i = 0; i < chapterCount; i++) {
                if (result.length >= limit) break;

                const response = await client.post("/proc/episode_list", `novel_no=${/\/novel\/(\d*)/g.exec(novelList.url)?.[1]}&page=${i}`);

                const $ = cheerio.load(response.data);

                $(".ep_style5").each((index, element) => {
                    if (result.length >= limit) return false;

                    const $element = cheerio.load(element);

                    if ($element("td > div").css("background-color") !== "#eee") return true;

                    result.push(/location ='(.*)'/g.exec($element("td:nth-child(2)").attr("onclick")!)?.[1]!);
                });
            }

            return result;
        }

        async function readNovel(url: string): Promise<Boolean> {
            try {
                await client.get(url);
                return true;
            } catch {
                return false;
            }
        }

        const novelList = await getNovelList();
        const novelChapter: string[] = [];
        const MAX = 50;

        for (const novel of novelList) {
            if (novelChapter.length >= MAX) break;

            novelChapter.push(...await getNovelChapter(novel, MAX));
        }

        let success = 0;
        let fail = 0;

        for (const chapter of novelChapter) {
            if (await readNovel(chapter))
                success++;
            else
                fail++;
        }

        if (novelChapter.length === 0) {
            return {
                success: false,
                error: "novelChapter is empty"
            };
        } else {
            return {
                success: true,
                message: `Success: ${success}, Fail: ${fail}`
            };
        }
    }
} as Module;