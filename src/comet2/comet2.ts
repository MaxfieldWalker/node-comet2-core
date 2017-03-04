"use strict"

import { Register16bit } from "../parts/register16bit";
import { Flag } from "../parts/flag";
import { Stack } from "../parts/stack";
import { Memory } from "../parts/memory";
import { ALU, ALUMode } from "./alu";
import { Comet2Option } from "./option";
import { dumpTo2ByteArray } from "../util/hexdumpHelper";
import { getMSB } from "../util/bit";

const defaultComet2Option: Comet2Option = {
    useGR8AsSP: false
};

/**
 * Comet2
 */
export class Comet2 {

    private _GR0: Register16bit;
    public get GR0(): number {
        return this._GR0.value;
    }

    private _GR1: Register16bit;
    public get GR1(): number {
        return this._GR1.value;
    }

    private _GR2: Register16bit;
    public get GR2(): number {
        return this._GR2.value;
    }

    private _GR3: Register16bit;
    public get GR3(): number {
        return this._GR3.value;
    }

    private _GR4: Register16bit;
    public get GR4(): number {
        return this._GR4.value;
    }

    private _GR5: Register16bit;
    public get GR5(): number {
        return this._GR5.value;
    }

    private _GR6: Register16bit;
    public get GR6(): number {
        return this._GR6.value;
    }

    private _GR7: Register16bit;
    public get GR7(): number {
        return this._GR7.value;
    }

    private _GR8: Register16bit;
    public get GR8(): number {
        return this._GR8.value;
    }

    private _OF: Flag;
    public get OF(): boolean {
        return this._OF.value;
    }

    private _SF: Flag;
    public get SF(): boolean {
        return this._SF.value;
    }

    private _ZF: Flag;
    public get ZF(): boolean {
        return this._ZF.value;
    }

    private _stack: Stack;
    private _memory: Memory;
    private _alu: ALU;
    private _PR: Register16bit;
    public get PR(): number {
        return this._PR.value;
    }

    public get grs() {
        return {
            gr0: this.GR0,
            gr1: this.GR1,
            gr2: this.GR2,
            gr3: this.GR3,
            gr4: this.GR4,
            gr5: this.GR5,
            gr6: this.GR6,
            gr7: this.GR7,
            gr8: this.GR8
        };
    }

    public get flags() {
        return {
            of: this.OF,
            sf: this.SF,
            zf: this.ZF
        };
    }

    constructor(private _comet2Option: Comet2Option = defaultComet2Option) {
        this._GR0 = new Register16bit("GR0", false, 0);
        this._GR1 = new Register16bit("GR1", true, 0);
        this._GR2 = new Register16bit("GR2", true, 0);
        this._GR3 = new Register16bit("GR3", true, 0);
        this._GR4 = new Register16bit("GR4", true, 0);
        this._GR5 = new Register16bit("GR5", true, 0);
        this._GR6 = new Register16bit("GR6", true, 0);
        this._GR7 = new Register16bit("GR7", true, 0);
        this._GR8 = new Register16bit("GR8", true, 0);

        this._OF = new Flag("OF");
        this._SF = new Flag("SF");
        this._ZF = new Flag("ZF");

        this._stack = new Stack(this._memory);
        this._memory = new Memory();
        this._alu = new ALU();

        // PRの最初の値は0
        this._PR = new Register16bit("PR", false, 0);
    }

    private numberToGR(n: number): GR {
        if (n == 0) return GR.GR0;
        if (n == 1) return GR.GR1;
        if (n == 2) return GR.GR2;
        if (n == 3) return GR.GR3;
        if (n == 4) return GR.GR4;
        if (n == 5) return GR.GR5;
        if (n == 6) return GR.GR6;
        if (n == 7) return GR.GR7;

        throw new Error();
    }

    public run(inputPath: string) {
        // メモリにプログラムを載せる
        const memory = dumpTo2ByteArray(inputPath);
        this._memory.load(memory);

        const pr = this._PR.value;
        // TODO: .comファイルの先頭にラベル名を含めないならoffsetは不要
        const offset = 8;
        // PRの位置にある命令を取得
        const v = this._memory.getMemroyValue(pr + offset);
        // 上二桁が命令である
        const inst = (v & 0xFF00) >> 8;
        // r1は3桁目にある
        const r1 = this.numberToGR((v & 0x00F0) >> 4);
        // r2は4桁目にある
        const r2 = this.numberToGR(v & 0x000F);
        const address = this._memory.getMemroyValue(pr + 1 + offset);

        if (inst == 0x00) this.nop();

        if (inst == 0x10 || 0x14) this.ld(r1, r2, address);
        if (inst == 0x11) this.st(r1, r2, address);
        if (inst == 0x12) this.lad(r1, r2, address);

        if (inst == 0x20 || inst == 0x24) this.adda(r1, r2, address);
        if (inst == 0x22 || inst == 0x26) this.addl(r1, r2, address);
        if (inst == 0x21 || inst == 0x25) this.suba(r1, r2, address);
        if (inst == 0x23 || inst == 0x27) this.subl(r1, r2, address);
        if (inst == 0x30 || inst == 0x34) this.and(r1, r2, address);
        if (inst == 0x31 || inst == 0x35) this.or(r1, r2, address);
        if (inst == 0x32 || inst == 0x36) this.xor(r1, r2, address);
        if (inst == 0x40 || inst == 0x44) this.cpa(r1, r2, address);
        if (inst == 0x41 || inst == 0x45) this.cpl(r1, r2, address);

        if (inst == 0x50) this.sla(r1, r2, address);
        if (inst == 0x51) this.sra(r1, r2, address);
        if (inst == 0x52) this.sll(r1, r2, address);
        if (inst == 0x53) this.srl(r1, r2, address);

        if (inst == 0x61) this.jmi(r1, r2, address);
        if (inst == 0x62) this.jnz(r1, r2, address);
        if (inst == 0x63) this.jze(r1, r2, address);
        if (inst == 0x64) this.jump(r1, r2, address);
        if (inst == 0x65) this.jpl(r1, r2, address);
        if (inst == 0x66) this.jov(r1, r2, address);

        if (inst == 0x70) this.push(r2, address);
        if (inst == 0x71) this.pop(r1);

        if (inst == 0x80) this.call(r2, address);
        if (inst == 0x81) this.ret();

        if (inst == 0xF0) this.svc(r2, address);

        this.updatePR(address);
    }

    private updatePR(adr?: number) {
        const newPR = this._PR.value + (adr === undefined ? 1 : 2);
        this._PR.value = newPR;
    }

    /**
     * NOP命令
     */
    nop() {
        // 何もしない
    }

    /**
     * LD命令
     */
    public ld(r1: GR, r2: GR, adr?: number) {
        const reg1 = this.grToReg(r1);
        const reg2 = this.grToReg(r2);

        reg1.value = this.effectiveAddressContent(reg2, adr);

        // LD命令はOFを0にする
        this._OF.putdown();
    }

    /**
     * ST命令
     */
    st(r1: GR, adr: number, r2?: GR) {
        const reg1 = this.grToReg(r1);
        const reg2 = r2 !== undefined ? this.grToReg(r2) : undefined;

        const effectiveAdr = this.effectiveAddress(adr, reg2);
        this._memory.setMemoryValue(reg1.value, effectiveAdr);
    }

    /**
     * LAD命令
     */
    public lad(r1: GR, r2: GR, adr: number) {
        const reg1 = this.grToReg(r1);
        const reg2 = this.grToReg(r2);

        const v2 = this.effectiveAddress(adr, reg2);
        reg1.value = v2;
    }

    /**
     * ADDA命令
     */
    public adda(r1: GR, r2: GR, adr?: number) {
        const add = (a: number, b: number) => a + b;
        this.operation(add, false, r1, r2, adr);
    }

    /**
     * ADDL命令
     */
    public addl(r1: GR, r2: GR, adr?: number) {
        const add = (a: number, b: number) => a + b;
        this.operation(add, true, r1, r2, adr);
    }

    /**
     * SUBA命令
     */
    public suba(r1: GR, r2: GR, adr?: number) {
        const sub = (a: number, b: number) => a - b;
        this.operation(sub, false, r1, r2, adr);
    }

    /**
     * SUBL命令
     */
    public subl(r1: GR, r2: GR, adr?: number) {
        throw new Error("not implemented");
    }

    /**
     * AND命令
     */
    public and(r1: GR, r2: GR, adr?: number) {
        throw new Error("not implemented");
    }

    /**
     * OR命令
     */
    public or(r1: GR, r2: GR, adr?: number) {
        throw new Error("not implemented");
    }

    /**
     * XOR命令
     */
    public xor(r1: GR, r2: GR, adr?: number) {
        throw new Error("not implemented");
    }

    /**
     * CPA命令
     */
    public cpa(r1: GR, r2: GR, adr?: number) {
        throw new Error("not implemented");
    }

    /**
     * CPL命令
     */
    public cpl(r1: GR, r2: GR, adr?: number) {
        throw new Error("not implemented");
    }

    /**
     * SLA命令
     */
    public sla(r1: GR, r2: GR, adr: number) {
        throw new Error("not implemented");
    }

    /**
     * SRA命令
     */
    public sra(r1: GR, r2: GR, adr: number) {
        throw new Error("not implemented");
    }

    /**
     * SLL命令
     */
    public sll(r1: GR, r2: GR, adr: number) {
        throw new Error("not implemented");
    }

    /**
     * JMI命令
     */
    public jmi(r1: GR, r2: GR, adr: number) {
        throw new Error("not implemented");
    }

    /**
     * JNZ命令
     */
    public jnz(r1: GR, r2: GR, adr: number) {
        throw new Error("not implemented");
    }

    /**
     * JZE命令
     */
    public jze(r1: GR, r2: GR, adr: number) {
        throw new Error("not implemented");
    }

    /**
     * JUMP命令
     */
    public jump(r1: GR, r2: GR, adr: number) {
        throw new Error("not implemented");
    }

    /**
     * JPL命令
     */
    public jpl(r1: GR, r2: GR, adr: number) {
        throw new Error("not implemented");
    }

    /**
     * JOV命令
     */
    public jov(r1: GR, r2: GR, adr: number) {
        throw new Error("not implemented");
    }

    /**
     * SLA命令
     */
    public srl(r1: GR, r2: GR, adr: number) {
        throw new Error("not implemented");
    }

    /**
     * PUSH命令
     */
    public push(r2: GR, adr: number) {
        throw new Error("not implemented");
    }

    /**
     * POP命令
     */
    public pop(r: GR) {
        throw new Error("not implemented");
    }

    /**
     * CALL命令
     */
    public call(r2: GR, adr: number) {
        throw new Error("not implemented");
    }

    /**
     * RET命令
     */
    public ret() {
        throw new Error("not implemented");
    }

    /**
     * SVC命令
     */
    public svc(r2: GR, adr: number) {
        throw new Error("not implemented");
    }


    /**
     * 実効アドレスを求める
     */
    private effectiveAddress(adr: number, reg?: Register16bit) {
        // GR0は指標レジスタとして使えないので0とする
        const add = reg
            ? reg.name == "GR0" ? 0 : reg.value
            : 0;

        const index = adr + add;
        return index;
    }

    /**
     * 実効アドレスの内容を返す
     */
    private effectiveAddressContent(reg: Register16bit, adr?: number) {
        if (adr == undefined) {
            return reg.value;
        } else {
            return this._memory.getMemroyValue(this.effectiveAddress(adr, reg));
        }
    }

    private operation(method: (a: number, b: number) => number, isLogical: boolean, r1: GR, r2: GR, adr?: number) {
        const reg1 = this.grToReg(r1);
        const reg2 = this.grToReg(r2);

        const v1 = reg1.value;
        const v2 = this.effectiveAddressContent(reg2, adr);
        const ans = method(v1, v2);
        const r = ans & 0xFFFF;
        reg1.value = r;

        const overflow = isLogical
            ? ans.toString(2).length > 16
            : getMSB(v1) == getMSB(v2) && getMSB(v1) != getMSB(r);

        // フラグを設定する
        overflow ? this._OF.raise() : this._OF.putdown();
        getMSB(r) == 1 ? this._SF.raise() : this._SF.putdown();
        r == 0 ? this._ZF.raise() : this._ZF.putdown();
    }

    private grToReg(r: GR): Register16bit {
        if (r == GR.GR0) return this._GR0;
        if (r == GR.GR1) return this._GR1;
        if (r == GR.GR2) return this._GR2;
        if (r == GR.GR3) return this._GR3;
        if (r == GR.GR4) return this._GR4;
        if (r == GR.GR5) return this._GR5;
        if (r == GR.GR6) return this._GR6;
        if (r == GR.GR7) return this._GR7;

        throw new Error();
    }

    getMemoryValue(index: number): number {
        return this._memory.getMemroyValue(index);
    }
}

export enum GR {
    GR0,
    GR1,
    GR2,
    GR3,
    GR4,
    GR5,
    GR6,
    GR7
}
