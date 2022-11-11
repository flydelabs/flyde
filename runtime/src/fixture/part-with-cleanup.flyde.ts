const part = {
    id: 'IdWithCleanup',
    inputs: {
        n: {mode: 'required', type: 'number'},
    },
    outputs: {
        r: 'runtime'
    },
    fn: ({n}, {r}, adv) => {
        adv.onCleanup(() => {
            adv.context.cleanupSpy();
        });
        r.next(n);
    }
}

export = part;