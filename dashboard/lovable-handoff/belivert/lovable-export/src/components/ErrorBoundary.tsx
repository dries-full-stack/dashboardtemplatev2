import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-background p-4 animate-in fade-in duration-500">
                    <div className="max-w-lg w-full bg-card border border-destructive/20 rounded-xl shadow-2xl p-8 space-y-6">
                        <div className="flex flex-col items-center text-center space-y-2">
                            <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center mb-2">
                                <AlertTriangle className="h-8 w-8 text-destructive" />
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">Er is een fout opgetreden</h1>
                            <p className="text-muted-foreground">
                                De applicatie heeft een onverwachte fout gedetecteerd en kan niet verder gaan.
                            </p>
                        </div>

                        {this.state.error && (
                            <div className="bg-muted p-4 rounded-lg text-xs font-mono overflow-auto max-h-[200px] border border-border">
                                <p className="font-semibold text-destructive mb-1">ErrorMessage:</p>
                                {this.state.error.toString()}
                                {this.state.errorInfo && (
                                    <>
                                        <p className="font-semibold text-destructive mt-3 mb-1">Stack Component:</p>
                                        {this.state.errorInfo.componentStack.split('\n')[1]?.trim() || 'Unknown'}
                                    </>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <Button
                                onClick={() => window.location.reload()}
                                variant="default"
                                className="w-full gap-2"
                                size="lg"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Pagina Herladen
                            </Button>
                            <Button
                                onClick={() => window.location.href = '/'}
                                variant="outline"
                                className="w-full gap-2"
                                size="lg"
                            >
                                <Home className="h-4 w-4" />
                                Naar Dashboard
                            </Button>
                        </div>

                        <p className="text-xs text-center text-muted-foreground pt-4">
                            Als dit probleem blijft bestaan, probeer dan de server te herstarten `npm run dev` of neem contact op met support.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
