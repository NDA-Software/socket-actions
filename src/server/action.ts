export default abstract class Action {
    async prepareAction (): Promise<void> {}

    protected async onCheckPermissions (_parameters: ActionParameters): Promise<void> {}

    protected async onError (_parameters: ActionParameters, err: unknown): Promise<void> {
        console.error(err);
    }

    async run (parameters: ActionParameters): Promise<void> {
        try {
            await this.onCheckPermissions(parameters);

            await this.onRun(parameters);
        } catch (err) {
            await this.onError(parameters, err);
        }
    };

    abstract onRun (data: ActionParameters): Promise<void>;
};
