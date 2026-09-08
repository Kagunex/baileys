import type { AuthenticationState } from "../Types/Auth.js";
export declare function useMultiFileAuthState(folder: string): Promise<{
    state: AuthenticationState;
    saveCreds: () => Promise<void>;
}>;
//# sourceMappingURL=use-multi-file-auth-state.d.ts.map