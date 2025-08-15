import { createServerSupabaseClient } from "@/lib/supabase-server"
import { Trophy, GraduationCap, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const dynamic = "force-dynamic"

type LeaderboardEntry = {
  name: string
  returned_count: number
  returned_party: string | null
  returned_year_section: string | null
  returned_at: string | null
}

export default async function HallOfFamePage() {
  const supabase = await createServerSupabaseClient()
  
  const { data: leaderboardData } = await supabase
    .from("items")
    .select("returned_party, returned_year_section, returned_at")
    .eq("status", "returned")
    .not("returned_party", "is", null)

  // Process data to count returns per person
  const returnCounts = new Map<string, LeaderboardEntry>()
  
  leaderboardData?.forEach((item) => {
    if (item.returned_party) {
      const existing = returnCounts.get(item.returned_party)
      if (existing) {
        existing.returned_count++
      } else {
        returnCounts.set(item.returned_party, {
          name: item.returned_party,
          returned_count: 1,
          returned_party: item.returned_party,
          returned_year_section: item.returned_year_section,
          returned_at: item.returned_at
        })
      }
    }
  })

  // Sort by return count (descending) and take top 20
  const sortedLeaderboard = Array.from(returnCounts.values())
    .sort((a, b) => b.returned_count - a.returned_count)
    .slice(0, 20)

  function getTrophyIcon(rank: number) {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />
    if (rank === 2) return <Trophy className="h-6 w-6 text-gray-400" />
    if (rank === 3) return <Trophy className="h-6 w-6 text-amber-600" />
    return <Trophy className="h-5 w-5 text-muted-foreground" />
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return "—"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
  }

  return (
    <main className="container mx-auto px-4 sm:px-6 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">🏆 Campus Guardian Leaderboard</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Celebrating the heroes who help reunite lost items with their owners. 
          These individuals have successfully returned items to their rightful owners.
        </p>
      </div>

      {sortedLeaderboard.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No returns yet</h3>
          <p className="text-muted-foreground mb-4">
            Be the first to return a lost item and earn your place on the leaderboard!
          </p>
          <Button asChild>
            <Link href="/post">Report Found Item</Link>
          </Button>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-4">
          {sortedLeaderboard.map((entry, index) => (
            <Card key={entry.name} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  {/* Rank and Trophy */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
                      {getTrophyIcon(index + 1)}
                    </div>
                    <div className="text-center min-w-[3rem]">
                      <div className="text-2xl font-bold text-muted-foreground">
                        #{index + 1}
                      </div>
                    </div>
                  </div>

                  {/* Name and Stats */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold truncate">{entry.name}</h3>
                      <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                        {entry.returned_count} {entry.returned_count === 1 ? "return" : "returns"}
                      </Badge>
                    </div>
                    
                    {/* Additional Info */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      {entry.returned_year_section && (
                        <div className="flex items-center gap-1">
                          <GraduationCap className="h-3 w-3" />
                          <span>{entry.returned_year_section}</span>
                        </div>
                      )}
                      {entry.returned_at && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Latest: {formatDate(entry.returned_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Notes Section */}
      <div className="max-w-4xl mx-auto mt-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📝 Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              • For lost reports, we credit the person who returned the item and show the owner as recipient.
            </p>
            <p>
              • For found reports, we credit the original reporter (finder) and show the owner as recipient.
            </p>
            <p>
              • This can be refined by capturing an explicit &quot;Returned by&quot; name universally.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
} 