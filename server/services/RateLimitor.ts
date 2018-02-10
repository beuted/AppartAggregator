export class RateLimitor {
    private _lastApiCall: number = 0;
    private _maxQPS: number;

    constructor(maxQPS: number) {
        this._maxQPS = maxQPS;
    }
    
    public async WaitAndQuery<T>(f: () => Promise<T>): Promise<T> {
        const nextpermitedCallTime = this._lastApiCall + 1000 / this._maxQPS;
        if (Date.now() < nextpermitedCallTime) {
            await this.Sleep(nextpermitedCallTime - Date.now());
        }
        
        this._lastApiCall = Date.now();
        return await f();
    }

    private async Sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}