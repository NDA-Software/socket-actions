export default function randomHash() {
    const randomArray = new Uint8Array(16);

    crypto.getRandomValues(randomArray);

    return Array.from(randomArray)
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
}
