import Foundation

enum CoachingSeverity: String, Codable {
    case info
    case warning
    case critical
}

struct CoachingFlag: Codable, Identifiable {
    var id: String { message }
    let message: String
    let severity: CoachingSeverity
}

struct CoachingResponse: Codable {
    let observations: [String]
    let installQualityFlags: [CoachingFlag]
    let salesPitchFeedback: [CoachingFlag]
    let timeOnTaskNote: String
    let nextSteps: [String]
}

struct SessionRow: Codable, Identifiable {
    let id: String
    let startedAt: String
    let endedAt: String?
    let worker: String?
    let jobType: String?
    let notes: String?
    let summary: String?

    enum CodingKeys: String, CodingKey {
        case id
        case startedAt = "started_at"
        case endedAt = "ended_at"
        case worker
        case jobType = "job_type"
        case notes
        case summary
    }
}

struct SessionCounts: Codable {
    let frames: Int
    let coachingEvents: Int
    let labels: Int
    let transcriptSegments: Int

    enum CodingKeys: String, CodingKey {
        case frames
        case coachingEvents = "coaching_events"
        case labels
        case transcriptSegments = "transcript_segments"
    }
}
