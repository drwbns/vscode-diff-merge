const pathDescription: RegExp = /@@ -(\d+),(\d+) \+(\d+),(\d+) @@((.|\n)*?)(?=@@ -(\d+),(\d+) \+(\d+),(\d+) @@|$)/g;

export function patchToCodes(patch: string): { leftContent: string, rightContent: string } {
    let leftContent = '';
    let rightContent = '';

    const matches = patch.matchAll(pathDescription);

    for (const match of matches) {
        const content = match[5];

        const lines = content.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
            if (line.startsWith('-')) {
                leftContent += line.slice(1) + '\n';
            } else if (line.startsWith('+')) {
                rightContent += line.slice(1) + '\n';
            } else if (line.startsWith(' ')) {
                leftContent += line.slice(1) + '\n';
                rightContent += line.slice(1) + '\n';
            }
        }
    }

    return { leftContent: leftContent.trim(), rightContent: rightContent.trim() };
}
