const parseCookies = (cookieString: string): any => {
    const cookieArray = cookieString.split(";").map((item) => item.split("="));

    const parsedCookies: Record<string, string> = {};

    for (const [key, value] of cookieArray) {
        const parsedKey = decodeURIComponent(key?.trim() as string);

        const parsedValue = decodeURIComponent(value?.trim() as string);

        parsedCookies[parsedKey] = parsedValue;
    }

    return parsedCookies;
};

export default parseCookies;
