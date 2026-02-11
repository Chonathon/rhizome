import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function FeedItemSkeleton() {
    return (
        <Card className="overflow-hidden">
            <div className="flex">
                <Skeleton className="shrink-0 w-24 h-24 sm:w-32 sm:h-32 rounded-none" />
                <div className="flex-1 min-w-0">
                    <CardHeader className="pb-2 p-4">
                        <Skeleton className="h-5 w-3/4" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="flex items-center gap-2 mb-2">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3 mt-1" />
                    </CardContent>
                </div>
            </div>
        </Card>
    );
}
