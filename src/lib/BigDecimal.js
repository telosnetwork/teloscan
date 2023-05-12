export class BigDecimal {
    static DECIMALS = 18;
    static ROUNDED = true;
    static SHIFT = BigInt('1' + '0'.repeat(BigDecimal.DECIMALS)); // derived constant
    constructor(value) {
        if (value instanceof BigDecimal){
            return value;
        }
        let [ints, decis] = String(value).split('.').concat('');
        this._n = BigInt(ints + decis.padEnd(BigDecimal.DECIMALS, '0')
            .slice(0, BigDecimal.DECIMALS))
            + BigInt(BigDecimal.ROUNDED && decis[BigDecimal.DECIMALS] >= '5');
    }
    static fromBigNumber(bignumber) {
        return Object.assign(Object.create(BigDecimal.prototype), { _n: bignumber });
    }
    static fromBigInt(bigint) {
        return Object.assign(Object.create(BigDecimal.prototype), { _n: bigint });
    }
    add(num) {
        return BigDecimal.fromBigInt(this._n + new BigDecimal(num)._n);
    }
    subtract(num) {
        return BigDecimal.fromBigInt(this._n - new BigDecimal(num)._n);
    }
    static _divRound(dividend, divisor) {
        return BigDecimal.fromBigInt(dividend / divisor
            + (BigDecimal.ROUNDED ? dividend  * 2n / divisor % 2n : 0n));
    }
    mul(num) {
        return BigDecimal._divRound(this._n * new BigDecimal(num)._n, BigDecimal.SHIFT);
    }
    div(num) {
        return BigDecimal._divRound(this._n * BigDecimal.SHIFT, new BigDecimal(num)._n);
    }
    toFixedString(fixed) {
        const s = this.toString();
        const parts = s.split('.');
        if(parts[1] && parts[1].length > fixed){
            return s.slice(0, parts[0].length + 1 + fixed);
        }
        return s;
    }
    toString() {
        const s = this._n.toString().padStart(BigDecimal.DECIMALS+1, '0');
        return s.slice(0, -BigDecimal.DECIMALS) + '.' + s.slice(-BigDecimal.DECIMALS)
            .replace(/\.?0+$/, '');
    }
}
