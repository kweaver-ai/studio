USE adp;
-- Storage configuration table
CREATE TABLE t_storage_config
(
    f_storage_id        VARCHAR(50)                              NOT NULL COMMENT 'Storage ID (Snowflake ID)',
    f_storage_name      VARCHAR(128)                             NOT NULL COMMENT 'Storage name',
    f_vendor_type       VARCHAR(32)                              NOT NULL COMMENT 'Vendor type: OSS/OBS/ECEPH',
    f_endpoint          VARCHAR(256)                             NOT NULL COMMENT 'Service endpoint URL',
    f_bucket_name       VARCHAR(128)                             NOT NULL COMMENT 'Bucket name',
    f_access_key_id     VARCHAR(256)                             NOT NULL COMMENT 'AccessKeyID (encrypted)',
    f_access_key        VARCHAR(512)                             NOT NULL COMMENT 'AccessKeySecret (encrypted)',
    f_region            VARCHAR(64)  DEFAULT ''                  NULL COMMENT 'Region (required for OSS/OBS, optional for ECEPH)',
    f_is_default        TINYINT(1)   DEFAULT 0                   NULL COMMENT 'Is default storage',
    f_is_enabled        TINYINT(1)   DEFAULT 1                   NULL COMMENT 'Is enabled',
    f_internal_endpoint VARCHAR(256) DEFAULT ''                  NULL COMMENT 'Internal access endpoint',
    f_site_id           VARCHAR(64)  DEFAULT ''                  NULL COMMENT 'Site ID for multi-tenant isolation',
    f_created_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP() NULL COMMENT 'Creation time',
    f_updated_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP() NULL ON UPDATE CURRENT_TIMESTAMP() COMMENT 'Update time',
    PRIMARY KEY (f_storage_id)
) COMMENT = 'Storage configuration table' COLLATE = utf8mb4_uca1400_ai_ci;

-- Indexes for t_storage_config
CREATE INDEX idx_vendor_type ON t_storage_config (f_vendor_type);
CREATE INDEX idx_is_enabled ON t_storage_config (f_is_enabled);
CREATE INDEX idx_bucket_endpoint ON t_storage_config (f_bucket_name, f_endpoint(255));
CREATE INDEX idx_bucket_site ON t_storage_config (f_bucket_name, f_site_id);

-- Multipart upload task table
CREATE TABLE t_multipart_upload_task
(
    f_id          VARCHAR(50)                           NOT NULL COMMENT 'Task ID (Snowflake ID)',
    f_storage_id  VARCHAR(50)                           NOT NULL COMMENT 'Associated storage ID',
    f_object_key  VARCHAR(512)                          NOT NULL COMMENT 'Object key',
    f_upload_id   VARCHAR(256)                          NOT NULL COMMENT 'Upload ID from vendor',
    f_total_size  BIGINT                                NOT NULL COMMENT 'Total file size',
    f_part_size   INT                                   NOT NULL COMMENT 'Part size in bytes',
    f_total_parts INT                                   NOT NULL COMMENT 'Total number of parts',
    f_status      SMALLINT  DEFAULT 0                   NULL COMMENT 'Status: 0=in progress, 1=completed, 2=cancelled',
    f_created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP() NULL COMMENT 'Creation time',
    f_expires_at  TIMESTAMP                             NOT NULL COMMENT 'Expiration time',
    PRIMARY KEY (f_id)
) COMMENT = 'Multipart upload task table' COLLATE = utf8mb4_uca1400_ai_ci;

-- Indexes for t_multipart_upload_task
CREATE INDEX idx_storage_id ON t_multipart_upload_task (f_storage_id);
CREATE INDEX idx_status ON t_multipart_upload_task (f_status);
CREATE INDEX idx_expires_at ON t_multipart_upload_task (f_expires_at);
