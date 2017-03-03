"use strict";

import { Comet2, GR } from "../../src/comet2/comet2";
import * as assert from "assert";

suite("Comet2 test", () => {
    test("NOP", () => {
        const comet2 = new Comet2();
        const { gr0, gr1, gr2, gr3, gr4, gr5, gr6, gr7, gr8 } = comet2.grs;
        const { of, sf, zf } = comet2.flags;
        const pr = comet2.PR;

        comet2.nop();

        // 何も変化していないか?
        assert.equal(comet2.GR0, gr0);
        assert.equal(comet2.GR1, gr1);
        assert.equal(comet2.GR2, gr2);
        assert.equal(comet2.GR3, gr3);
        assert.equal(comet2.GR4, gr4);
        assert.equal(comet2.GR5, gr5);
        assert.equal(comet2.GR6, gr6);
        assert.equal(comet2.GR7, gr7);
        assert.equal(comet2.GR8, gr8);

        assert.equal(comet2.OF, of);
        assert.equal(comet2.SF, sf);
        assert.equal(comet2.ZF, zf);

        // PRは1進む
        assert.equal(comet2.PR - pr, 1);
    });

    test("LD", () => {
        const comet2 = new Comet2();
        comet2.lad(GR.GR2, GR.GR0, 0x0003);
        comet2.ld(GR.GR1, GR.GR2);

        const result = comet2.GR1;
        assert.equal(result, 0x0003);
    });

    test("ST", () => {
        const comet2 = new Comet2();
        comet2.lad(GR.GR2, GR.GR0, 0x0002);
        comet2.st(GR.GR2, 0x0100);

        assert.equal(comet2.getMemoryValue(0x0100), 0x0002);

        comet2.lad(GR.GR3, GR.GR0, 0x0003);
        comet2.st(GR.GR3, 0x0200, GR.GR2);

        assert.equal(comet2.getMemoryValue(0x0202), 0x0003);
    });

    test("LAD", () => {
        const comet2 = new Comet2();
        comet2.lad(GR.GR1, GR.GR0, 0x0003);

        const result = comet2.GR1;
        assert.equal(result, 0x0003);
    });


    test("ADDA", () => {
        const comet2 = new Comet2();
        comet2.lad(GR.GR1, GR.GR0, 0x0002);
        comet2.lad(GR.GR2, GR.GR0, 0x0003);
        comet2.adda(GR.GR1, GR.GR2);

        const result = comet2.GR1;
        assert.equal(result, 0x0005);

        // TODO: 32767を超えるテストをする(OFフラグが立っているかもチェック)
        // TODO: -32768を超えるテストをする
    });

    test("SUBA", () => {
        const comet2 = new Comet2();
        comet2.lad(GR.GR1, GR.GR0, 0x0003);
        comet2.lad(GR.GR2, GR.GR0, 0x0002);
        comet2.suba(GR.GR1, GR.GR2);

        const result = comet2.GR1;
        assert.equal(result, 0x0001);

        // TODO: 32767を超えるテストをする(OFフラグが立っているかもチェック)
        // TODO: -32768を超えるテストをする
    });
});
