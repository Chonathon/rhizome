import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function FeedItemSkeleton() {
    return (
        <Card>
            <CardHeader className="pb-2 p-4">
                <Skeleton className="h-5 w-3/4" />
            </CardHeader>
            <CardContent className="pt-0 p-4 pt-0">
                <div className="flex items-center gap-2 mb-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3 mt-1" />
            </CardContent>
        </Card>
    );
}
