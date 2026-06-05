import SwiftUI

struct SessionSummaryView: View {
    let session: SessionRow
    let stored: SessionCounts

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("JOB SUMMARY")
                .font(.caption.weight(.semibold))
                .foregroundStyle(.green)

            Text(session.summary ?? "No summary returned.")
                .font(.body)

            Divider()

            Text("Stored in Supabase")
                .font(.caption.weight(.semibold))

            VStack(alignment: .leading, spacing: 4) {
                Text("\(stored.frames) frames")
                Text("\(stored.coachingEvents) coaching events")
                Text("\(stored.labels) labels")
                Text("\(stored.transcriptSegments) transcript segments")
            }
            .font(.subheadline)

            Text("Session \(session.id)")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color.green.opacity(0.12), in: RoundedRectangle(cornerRadius: 16))
    }
}
