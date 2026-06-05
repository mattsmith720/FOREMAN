import SwiftUI

struct CoachingView: View {
    let coaching: CoachingResponse?

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            if let coaching {
                if !coaching.observations.isEmpty {
                    section(title: "Observations", lines: coaching.observations)
                }

                if !coaching.installQualityFlags.isEmpty {
                    flagSection(title: "Install quality", flags: coaching.installQualityFlags)
                }

                if !coaching.salesPitchFeedback.isEmpty {
                    flagSection(title: "Sales pitch", flags: coaching.salesPitchFeedback)
                }

                if !coaching.timeOnTaskNote.isEmpty {
                    section(title: "Time on task", lines: [coaching.timeOnTaskNote])
                }

                if !coaching.nextSteps.isEmpty {
                    section(title: "Next steps", lines: coaching.nextSteps)
                }
            } else {
                Text("Coaching will appear after the first analysed frame.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
    }

    @ViewBuilder
    private func section(title: String, lines: [String]) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title.uppercased())
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)
            ForEach(lines, id: \.self) { line in
                Text("• \(line)")
                    .font(.subheadline)
            }
        }
    }

    @ViewBuilder
    private func flagSection(title: String, flags: [CoachingFlag]) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title.uppercased())
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)
            ForEach(flags) { flag in
                Text(flag.message)
                    .font(.subheadline)
                    .padding(10)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(flagColor(flag.severity).opacity(0.15))
                    .overlay(
                        Rectangle()
                            .fill(flagColor(flag.severity))
                            .frame(width: 3),
                        alignment: .leading
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 10))
            }
        }
    }

    private func flagColor(_ severity: CoachingSeverity) -> Color {
        switch severity {
        case .info: return .cyan
        case .warning: return .orange
        case .critical: return .red
        }
    }
}
