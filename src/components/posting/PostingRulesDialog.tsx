"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { markPostingRulesAgreed } from "@/lib/posting-rules"

export function PostingRulesDialog({ open, onOpenChange, onContinue }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onContinue: () => void
}) {
  const [agreed, setAgreed] = React.useState(false)

  React.useEffect(() => {
    if (!open) setAgreed(false)
  }, [open])

  const handleContinue = () => {
    // Store the agreement using the utility function
    markPostingRulesAgreed()
    onContinue()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
<DialogContent className="max-w-sm w-full mx-auto my-4">
<DialogHeader>
          <DialogTitle>Lost &amp; Found Posting Rules</DialogTitle>
          <p className="text-xs text-destructive">(Mosqueda Campus Only)</p>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <ul className="list-disc pl-5 space-y-1">
            <li>Only Mosqueda Campus students, staff, or faculty may submit lost or found item reports.</li>
            <li>All information you post must be true and accurate.</li>
            <li>Contact details will only be used to help return the item.</li>
            <li>Misuse of this platform may result in removal of your posts or suspension of posting rights.</li>
          </ul>

          <div className="mt-2 flex items-center gap-2">
            <input id="agree_rules" type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <Label htmlFor="agree_rules" className="text-sm">
              <span className="text-xs align-middle italic">I confirm that I am affiliated with Mosqueda Campus and agree to these rules.</span>
            </Label>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="flex-1" disabled={!agreed} onClick={handleContinue}>Continue</Button>
        </div>
        
        <p className="text-xs text-muted-foreground text-center mt-2">
          This agreement will be remembered for future posts.
        </p>
      </DialogContent>
    </Dialog>
  )
} 