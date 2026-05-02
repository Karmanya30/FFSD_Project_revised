
-- =============================================================================
--  GAMING COMMUNITY, MODERATION & ENGAGEMENT PLATFORM
--  Database Schema
-- =============================================================================
--  TABLES (17 total):
--   1.  Roles
--   2.  Users
--   3.  UserSessions
--   4.  Communities
--   5.  Channels
--   6.  CommunityMembers
--   7.  XPTransactions
--   8.  Events
--   9.  EventRegistrations
--  10.  EventFeedback
--  11.  Messages
--  12.  AutoModerationRules
--  13.  ModerationLogs
--  14.  Reports
--  15.  ModerationActions
--  16.  Appeals
--  17.  Notifications
-- =============================================================================

DROP DATABASE IF EXISTS gaming_platform;
CREATE DATABASE gaming_platform
    
USE gaming_platform;


-- =============================================================================
-- TABLE 1: Roles
-- =============================================================================
CREATE TABLE Roles (
    role_id     INT          NOT NULL AUTO_INCREMENT,
    role_name   VARCHAR(50)  NOT NULL,
    description VARCHAR(255) NULL,

    CONSTRAINT pk_roles      PRIMARY KEY (role_id),
    CONSTRAINT uq_roles_name UNIQUE      (role_name)
);


-- =============================================================================
-- TABLE 2: Users
-- =============================================================================
CREATE TABLE Users (
    user_id       INT          NOT NULL AUTO_INCREMENT,
    username      VARCHAR(50)  NOT NULL,
    email         VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    xp_points     INT          NOT NULL DEFAULT 0,
    status        ENUM('active','muted','banned','suspended')
                               NOT NULL DEFAULT 'active',
    avatar_url    VARCHAR(500) NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    role_id       INT          NOT NULL,

    CONSTRAINT pk_users           PRIMARY KEY (user_id),
    CONSTRAINT uq_users_username  UNIQUE      (username),
    CONSTRAINT uq_users_email     UNIQUE      (email),
    CONSTRAINT ck_xp_non_negative CHECK       (xp_points >= 0),
    CONSTRAINT fk_users_role      FOREIGN KEY (role_id)
                                  REFERENCES  Roles(role_id)
                                  ON UPDATE CASCADE ON DELETE RESTRICT,
);


-- =============================================================================
-- TABLE 3: UserSessions
-- =============================================================================
CREATE TABLE UserSessions (
    session_id  INT          NOT NULL AUTO_INCREMENT,
    token       VARCHAR(255) NOT NULL,
    ip_address  VARCHAR(45)  NULL,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at  DATETIME     NULL,
    user_id     INT          NOT NULL,

    CONSTRAINT pk_user_sessions PRIMARY KEY (session_id),
    CONSTRAINT uq_session_token UNIQUE      (token),
    CONSTRAINT fk_session_user  FOREIGN KEY (user_id)
                                REFERENCES  Users(user_id)
                                ON UPDATE CASCADE ON DELETE CASCADE,
);


-- =============================================================================
-- TABLE 4: Communities
-- =============================================================================
CREATE TABLE Communities (
    community_id INT          NOT NULL AUTO_INCREMENT,
    name         VARCHAR(100) NOT NULL,
    description  TEXT         NULL,
    game_name    VARCHAR(100) NOT NULL,
    member_count INT          NOT NULL DEFAULT 0,
    status       ENUM('draft','published','archived')
                              NOT NULL DEFAULT 'draft',
    rules        JSON         NULL,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    owner_id     INT          NOT NULL,

    CONSTRAINT pk_communities     PRIMARY KEY (community_id),
    CONSTRAINT uq_community_name  UNIQUE      (name),
    CONSTRAINT fk_community_owner FOREIGN KEY (owner_id)
                                  REFERENCES  Users(user_id)
                                  ON UPDATE CASCADE ON DELETE RESTRICT,
);


-- =============================================================================
-- TABLE 5: Channels
-- =============================================================================
CREATE TABLE Channels (
    channel_id   INT          NOT NULL AUTO_INCREMENT,
    channel_name VARCHAR(100) NOT NULL,
    channel_type ENUM('text','voice','announcement')
                              NOT NULL DEFAULT 'text',
    description  VARCHAR(255) NULL,
    permissions  JSON         NULL,
    is_archived  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by   INT          NOT NULL,
    community_id INT          NOT NULL,

    CONSTRAINT pk_channels           PRIMARY KEY (channel_id),
    CONSTRAINT uq_channel_per_comm   UNIQUE      (community_id, channel_name),
    CONSTRAINT fk_channels_community FOREIGN KEY (community_id)
                                     REFERENCES  Communities(community_id)
                                     ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_channels_creator  FOREIGN KEY (created_by)
                                     REFERENCES  Users(user_id)
                                     ON UPDATE CASCADE ON DELETE RESTRICT,
);


-- =============================================================================
-- TABLE 6: CommunityMembers
-- =============================================================================
CREATE TABLE CommunityMembers (
    membership_id INT      NOT NULL AUTO_INCREMENT,
    status        ENUM('pending','approved','rejected','banned')
                           NOT NULL DEFAULT 'pending',
    requested_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    joined_at     DATETIME NULL,
    user_id       INT      NOT NULL,
    community_id  INT      NOT NULL,

    CONSTRAINT pk_community_members    PRIMARY KEY (membership_id),
    CONSTRAINT uq_member_per_community UNIQUE      (user_id, community_id),
    CONSTRAINT fk_member_user          FOREIGN KEY (user_id)
                                       REFERENCES  Users(user_id)
                                       ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_member_community     FOREIGN KEY (community_id)
                                       REFERENCES  Communities(community_id)
                                       ON UPDATE CASCADE ON DELETE CASCADE,
);


-- =============================================================================
-- TABLE 7: XPTransactions
-- =============================================================================
CREATE TABLE XPTransactions (
    xp_id        INT          NOT NULL AUTO_INCREMENT,
    points       INT          NOT NULL,
    reason       VARCHAR(150) NOT NULL,
    awarded_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id      INT          NOT NULL,

    CONSTRAINT pk_xp_transactions PRIMARY KEY (xp_id),
    CONSTRAINT ck_xp_positive     CHECK       (points > 0),
    CONSTRAINT fk_xp_user         FOREIGN KEY (user_id)
                                  REFERENCES  Users(user_id)
                                  ON UPDATE CASCADE ON DELETE CASCADE,
);


-- =============================================================================
-- TABLE 8: Events
-- =============================================================================
CREATE TABLE Events (
    event_id         INT          NOT NULL AUTO_INCREMENT,
    title            VARCHAR(150) NOT NULL,
    description      TEXT         NULL,
    event_type       ENUM('manager_created','gamer_requested')
                                  NOT NULL,
    status           ENUM('pending','approved','rejected',
                          'scheduled','active','completed','cancelled')
                                  NOT NULL DEFAULT 'pending',
    scheduled_at     DATETIME     NULL,
    ends_at          DATETIME     NULL,
    max_participants INT          NULL,
    rejection_reason TEXT         NULL,
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by       INT          NOT NULL,
    community_id     INT          NOT NULL,
    requested_by     INT          NULL,

    CONSTRAINT pk_events              PRIMARY KEY (event_id),
    CONSTRAINT ck_event_dates         CHECK       (ends_at IS NULL OR ends_at > scheduled_at),
    CONSTRAINT ck_max_participants    CHECK       (max_participants IS NULL OR max_participants > 0),
    CONSTRAINT fk_events_community    FOREIGN KEY (community_id)
                                      REFERENCES  Communities(community_id)
                                      ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_events_created_by   FOREIGN KEY (created_by)
                                      REFERENCES  Users(user_id)
                                      ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_events_requested_by FOREIGN KEY (requested_by)
                                      REFERENCES  Users(user_id)
                                      ON UPDATE CASCADE ON DELETE SET NULL,
);


-- =============================================================================
-- TABLE 9: EventRegistrations
-- =============================================================================
CREATE TABLE EventRegistrations (
    registration_id INT      NOT NULL AUTO_INCREMENT,
    status          ENUM('registered','confirmed','cancelled','attended')
                             NOT NULL DEFAULT 'registered',
    registered_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    event_id        INT      NOT NULL,
    user_id         INT      NOT NULL,

    CONSTRAINT pk_event_registrations PRIMARY KEY (registration_id),
    CONSTRAINT uq_event_user_reg      UNIQUE      (event_id, user_id),
    CONSTRAINT fk_reg_event           FOREIGN KEY (event_id)
                                      REFERENCES  Events(event_id)
                                      ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_reg_user            FOREIGN KEY (user_id)
                                      REFERENCES  Users(user_id)
                                      ON UPDATE CASCADE ON DELETE CASCADE,
);


-- =============================================================================
-- TABLE 10: EventFeedback
-- =============================================================================
CREATE TABLE EventFeedback (
    feedback_id  INT     NOT NULL AUTO_INCREMENT,
    rating       TINYINT NULL,
    comments     TEXT    NULL,
    submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    event_id     INT      NOT NULL,
    user_id      INT      NOT NULL,

    CONSTRAINT pk_event_feedback    PRIMARY KEY (feedback_id),
    CONSTRAINT uq_feedback_per_user UNIQUE      (event_id, user_id),
    CONSTRAINT ck_feedback_rating   CHECK       (rating IS NULL OR rating BETWEEN 1 AND 5),
    CONSTRAINT fk_feedback_event    FOREIGN KEY (event_id)
                                    REFERENCES  Events(event_id)
                                    ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_feedback_user     FOREIGN KEY (user_id)
                                    REFERENCES  Users(user_id)
                                    ON UPDATE CASCADE ON DELETE CASCADE,
);


-- =============================================================================
-- TABLE 11: Messages
-- =============================================================================
CREATE TABLE Messages (
    message_id INT      NOT NULL AUTO_INCREMENT,
    content    TEXT     NOT NULL,
    is_flagged BOOLEAN  NOT NULL DEFAULT FALSE,
    posted_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    channel_id INT      NOT NULL,
    user_id    INT      NOT NULL,

    CONSTRAINT pk_messages    PRIMARY KEY (message_id),
    CONSTRAINT fk_msg_channel FOREIGN KEY (channel_id)
                              REFERENCES  Channels(channel_id)
                              ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_msg_user    FOREIGN KEY (user_id)
                              REFERENCES  Users(user_id)
                              ON UPDATE CASCADE ON DELETE CASCADE,
);


-- =============================================================================
-- TABLE 12: AutoModerationRules
-- =============================================================================
CREATE TABLE AutoModerationRules (
    rule_id           INT          NOT NULL AUTO_INCREMENT,
    rule_name         VARCHAR(100) NOT NULL,
    rule_type         ENUM('keyword_filter','pattern_match',
                           'spam_detection','toxicity_score')
                                   NOT NULL,
    rule_value        TEXT         NOT NULL,
    action_on_trigger ENUM('flag','auto_mute','auto_delete','escalate')
                                   NOT NULL DEFAULT 'flag',
    is_active         BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by        INT          NOT NULL,

    CONSTRAINT pk_auto_mod_rules  PRIMARY KEY (rule_id),
    CONSTRAINT uq_rule_name       UNIQUE      (rule_name),
    CONSTRAINT fk_rule_created_by FOREIGN KEY (created_by)
                                  REFERENCES  Users(user_id)
                                  ON UPDATE CASCADE ON DELETE RESTRICT,
);


-- =============================================================================
-- TABLE 13: ModerationLogs
-- =============================================================================
CREATE TABLE ModerationLogs (
    log_id                 INT      NOT NULL AUTO_INCREMENT,
    analysis_result        ENUM('clean','flagged','escalated')
                                    NOT NULL,
    escalated_to_moderator BOOLEAN  NOT NULL DEFAULT FALSE,
    flagged_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    message_id             INT      NOT NULL,
    violated_rule_id       INT      NULL,

    CONSTRAINT pk_moderation_logs PRIMARY KEY (log_id),
    CONSTRAINT uq_log_per_message UNIQUE      (message_id),
    CONSTRAINT fk_log_message     FOREIGN KEY (message_id)
                                  REFERENCES  Messages(message_id)
                                  ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_log_rule        FOREIGN KEY (violated_rule_id)
                                  REFERENCES  AutoModerationRules(rule_id)
                                  ON UPDATE CASCADE ON DELETE SET NULL,
);


-- =============================================================================
-- TABLE 14: Reports
-- =============================================================================
CREATE TABLE Reports (
    report_id             INT          NOT NULL AUTO_INCREMENT,
    reason                VARCHAR(100) NOT NULL,
    description           TEXT         NULL,
    status                ENUM('open','under_review','resolved_valid',
                               'resolved_invalid','closed')
                                       NOT NULL DEFAULT 'open',
    submitted_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at           DATETIME     NULL,
    reporter_id           INT          NOT NULL,
    reported_user_id      INT          NULL,
    reported_message_id   INT          NULL,
    assigned_moderator_id INT          NULL,

    CONSTRAINT pk_reports              PRIMARY KEY (report_id),
    CONSTRAINT ck_report_has_target    CHECK (
                                           reported_user_id    IS NOT NULL OR
                                           reported_message_id IS NOT NULL
                                       ),
    CONSTRAINT fk_report_reporter      FOREIGN KEY (reporter_id)
                                       REFERENCES  Users(user_id)
                                       ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_report_reported_user FOREIGN KEY (reported_user_id)
                                       REFERENCES  Users(user_id)
                                       ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_report_message       FOREIGN KEY (reported_message_id)
                                       REFERENCES  Messages(message_id)
                                       ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_report_moderator     FOREIGN KEY (assigned_moderator_id)
                                       REFERENCES  Users(user_id)
                                       ON UPDATE CASCADE ON DELETE SET NULL,
);


-- =============================================================================
-- TABLE 15: ModerationActions
-- =============================================================================
CREATE TABLE ModerationActions (
    action_id      INT      NOT NULL AUTO_INCREMENT,
    action_type    ENUM('warning','mute','temporary_ban',
                        'permanent_ban','no_action')
                            NOT NULL,
    scope          ENUM('community','platform')
                            NOT NULL DEFAULT 'community',
    duration_hours INT      NULL,
    notes          TEXT     NULL,
    taken_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at     DATETIME NULL,
    report_id      INT      NOT NULL,
    moderator_id   INT      NOT NULL,
    target_user_id INT      NOT NULL,
    community_id   INT      NULL,

    CONSTRAINT pk_moderation_actions PRIMARY KEY (action_id),
    CONSTRAINT uq_action_per_report  UNIQUE      (report_id),
    CONSTRAINT fk_action_report      FOREIGN KEY (report_id)
                                     REFERENCES  Reports(report_id)
                                     ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_action_moderator   FOREIGN KEY (moderator_id)
                                     REFERENCES  Users(user_id)
                                     ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_action_target      FOREIGN KEY (target_user_id)
                                     REFERENCES  Users(user_id)
                                     ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_action_community   FOREIGN KEY (community_id)
                                     REFERENCES  Communities(community_id)
                                     ON UPDATE CASCADE ON DELETE SET NULL,
);


-- =============================================================================
-- TABLE 16: Appeals
-- =============================================================================
CREATE TABLE Appeals (
    appeal_id       INT      NOT NULL AUTO_INCREMENT,
    appeal_reason   TEXT     NOT NULL,
    status          ENUM('pending','under_review','approved','rejected')
                             NOT NULL DEFAULT 'pending',
    review_date     DATETIME NULL,
    moderator_notes TEXT     NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id         INT      NOT NULL,
    action_id       INT      NOT NULL,
    reviewed_by     INT      NULL,

    CONSTRAINT pk_appeals           PRIMARY KEY (appeal_id),
    CONSTRAINT uq_appeal_per_action UNIQUE      (action_id),
    CONSTRAINT fk_appeal_user       FOREIGN KEY (user_id)
                                    REFERENCES  Users(user_id)
                                    ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_appeal_action     FOREIGN KEY (action_id)
                                    REFERENCES  ModerationActions(action_id)
                                    ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_appeal_reviewer   FOREIGN KEY (reviewed_by)
                                    REFERENCES  Users(user_id)
                                    ON UPDATE CASCADE ON DELETE SET NULL,
);


-- =============================================================================
-- TABLE 17: Notifications
-- =============================================================================
CREATE TABLE Notifications (
    notification_id INT         NOT NULL AUTO_INCREMENT,
    type            ENUM(
                        'event_reminder',
                        'event_confirmation',
                        'report_submitted',
                        'report_resolved',
                        'appeal_outcome',
                        'join_approved',
                        'join_rejected',
                        'event_request_approved',
                        'event_request_rejected',
                        'moderation_action',
                        'community_update'
                    )           NOT NULL,
    message         TEXT        NOT NULL,
    reference_id    INT         NULL,
    reference_type  VARCHAR(50) NULL,
    is_read         BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id         INT         NOT NULL,

    CONSTRAINT pk_notifications PRIMARY KEY (notification_id),
    CONSTRAINT fk_notif_user    FOREIGN KEY (user_id)
                                REFERENCES  Users(user_id)
                                ON UPDATE CASCADE ON DELETE CASCADE,
);


-- =============================================================================
-- END OF DBschema.sql
-- =============================================================================
