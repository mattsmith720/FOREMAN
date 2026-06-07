import Foundation

enum CoachingSeverity: String, Codable {
    case info
    case warning
    case critical
}

/// Mirrors `visualCalloutCategory` in shared/src/coaching.ts.
enum VisualCalloutCategory: String, Codable {
    case quality
    case safety
    case pitch
    case upsell
    case cleanliness
    case damage
    case time
}

enum VisualCalloutShape: String, Codable {
    case circle
    case box
    case pointer
}

/// On-frame highlight — normalized x/y center (0–1) relative to the captured frame.
struct VisualCallout: Decodable, Identifiable {
    let calloutId: String?
    let label: String
    let message: String
    let category: VisualCalloutCategory
    let severity: CoachingSeverity
    let x: Double
    let y: Double
    let w: Double?
    let h: Double?
    let shape: VisualCalloutShape

    var id: String { calloutId ?? label }

    enum CodingKeys: String, CodingKey {
        case calloutId = "id"
        case label, message, category, severity, x, y, w, h, shape
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        calloutId = try container.decodeIfPresent(String.self, forKey: .calloutId)
        label = try container.decode(String.self, forKey: .label)
        message = try container.decode(String.self, forKey: .message)
        category = try container.decode(VisualCalloutCategory.self, forKey: .category)
        severity = try container.decode(CoachingSeverity.self, forKey: .severity)
        x = try container.decode(Double.self, forKey: .x)
        y = try container.decode(Double.self, forKey: .y)
        w = try container.decodeIfPresent(Double.self, forKey: .w)
        h = try container.decodeIfPresent(Double.self, forKey: .h)
        shape = try container.decodeIfPresent(VisualCalloutShape.self, forKey: .shape) ?? .circle
    }
}

/// CER evidence classification for a frame — mirrors `evidenceShot` in shared coaching schema.
enum EvidenceShotType: String, Codable {
    case meter_box
    case switchboard
    case dc_isolator
    case inverter
    case serial_plate
    case battery_label
    case array_complete
    case roof_penetration
    case setup
    case testing
}

struct EvidenceShot: Decodable {
    let type: EvidenceShotType
    let isGoodEvidence: Bool
}

/// Geo/timestamp metadata sent with analyse requests (not part of coaching response).
struct CaptureMeta: Codable {
    let capturedAt: String
    let lat: Double?
    let lng: Double?
    let complianceShotId: String?
}

struct CoachingFlag: Codable, Identifiable {
    var id: String { message }
    let message: String
    let severity: CoachingSeverity
}

struct SpokenCue: Decodable {
    let say: String
    let severity: CoachingSeverity
    let speak: Bool
}

struct CoachingResponse: Decodable {
    let observations: [String]
    let installQualityFlags: [CoachingFlag]
    let salesPitchFeedback: [CoachingFlag]
    let timeOnTaskNote: String
    let nextSteps: [String]
    let visualCallouts: [VisualCallout]
    let spokenCue: SpokenCue?
    let evidenceShot: EvidenceShot?

    enum CodingKeys: String, CodingKey {
        case observations
        case installQualityFlags
        case salesPitchFeedback
        case timeOnTaskNote
        case nextSteps
        case visualCallouts
        case spokenCue
        case evidenceShot
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        observations = try container.decode([String].self, forKey: .observations)
        installQualityFlags = try container.decode([CoachingFlag].self, forKey: .installQualityFlags)
        salesPitchFeedback = try container.decode([CoachingFlag].self, forKey: .salesPitchFeedback)
        timeOnTaskNote = try container.decode(String.self, forKey: .timeOnTaskNote)
        nextSteps = try container.decode([String].self, forKey: .nextSteps)
        visualCallouts =
            try container.decodeIfPresent([VisualCallout].self, forKey: .visualCallouts) ?? []
        spokenCue = try container.decodeIfPresent(SpokenCue.self, forKey: .spokenCue)
        evidenceShot = try container.decodeIfPresent(EvidenceShot.self, forKey: .evidenceShot)
    }
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
