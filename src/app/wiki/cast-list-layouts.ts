export abstract class CastListLayout {
    protected _score: number = 0;
    protected _exp: string;

    constructor(
        readonly expression: string,
        public readonly separator: string,
    ) {
        this._exp = expression;
    }

    public get score(): number { return this._score };

    public scoreCastEntry(items: { text: string}[]) {
        this._score = items.map(item => item.text)
        .reduce(
            (count: number, current: string): number => {
                return count + this.scoreText(current);
            },
            0
        );
    }

    protected scoreText(text: string): number {
        let score = 0;
        let reg = new RegExp(this._exp);

        const match = reg.exec(text);
        if (match) {
            score++;
            if (match.index < 50) {
                score += 50 - match.index;
            }
        }
        return score;
    }
}

export class AsCastListLayout extends CastListLayout {

    // TO DO: problem with Margaret Claire, (credited as Maggie Claire) as the vicar's wife

    constructor() {
        super("\\s+as\\s+", " as ");
    }
}

export class CommaCastListLayout extends CastListLayout {

    constructor() {
        super(",\\s+", ", ");
    }
}
export class HyphenCastListLayout extends CastListLayout {
    private static readonly hyphenChars = `\u002D\u058A\u05BE\u1400\u1806\u2010-\u2015\u2E17\u2E1A\u2E3A\u2E3B\u2E40\u301C\u3030\u30A0\uFE31\uFE32\uFE58\uFE63\uFF0D`;
    private static readonly withHyphenExp = "\\s+[" + HyphenCastListLayout.hyphenChars + "]\\s+";

    constructor() {
        super(HyphenCastListLayout.withHyphenExp, " - ");
    }
}

