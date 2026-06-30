import { Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MOCK_REVIEWS = [
  { id: 1, client: "Besim Krasniqi", rating: 5, comment: "Punë shumë e mirë! Prerja doli perfekte.", date: "2025-06-25" },
  { id: 2, client: "Drin Gashi", rating: 4, comment: "Shërbim i shkëlqyer, shumë i kujdesshëm.", date: "2025-06-20" },
  { id: 3, client: "Ermal Berisha", rating: 5, comment: "Shumë profesional, do vij përsëri!", date: "2025-06-15" },
  { id: 4, client: "Fisnik Lahu", rating: 4, comment: "Shumë mirë, koha e pritjes pak e gjatë.", date: "2025-06-10" },
];

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`w-4 h-4 ${i <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );
}

export default function BarberReviews() {
  const avg = MOCK_REVIEWS.reduce((s, r) => s + r.rating, 0) / MOCK_REVIEWS.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vlerësimet</h1>
        <p className="text-muted-foreground mt-1">Çfarë thonë klientët tuaj</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="sm:col-span-1">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <p className="text-5xl font-extrabold text-primary">{avg.toFixed(1)}</p>
            <Stars rating={Math.round(avg)} />
            <p className="text-sm text-muted-foreground mt-2">{MOCK_REVIEWS.length} vlerësime</p>
          </CardContent>
        </Card>
        <Card className="sm:col-span-2">
          <CardHeader><CardTitle className="text-base">Shpërndarja e vlerësimeve</CardTitle></CardHeader>
          <CardContent>
            {[5,4,3,2,1].map(star => {
              const count = MOCK_REVIEWS.filter(r => r.rating === star).length;
              const pct = (count / MOCK_REVIEWS.length) * 100;
              return (
                <div key={star} className="flex items-center gap-2 mb-2">
                  <span className="w-3 text-xs text-muted-foreground">{star}</span>
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <div className="flex-1 bg-secondary rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-yellow-400" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-4 text-xs text-muted-foreground">{count}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {MOCK_REVIEWS.map(r => (
          <div key={r.id} className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {r.client.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-sm">{r.client}</p>
                  <p className="text-xs text-muted-foreground">{r.date}</p>
                </div>
              </div>
              <Stars rating={r.rating} />
            </div>
            {r.comment && <p className="text-sm text-muted-foreground mt-3 pl-12">{r.comment}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
