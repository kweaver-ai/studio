USE adp;
-- Storage configuration table for DM8
CREATE TABLE t_storage_config
(
    f_storage_id        VARCHAR(50)                         NOT NULL,
    f_storage_name      VARCHAR(128)                        NOT NULL,
    f_vendor_type       VARCHAR(32)                         NOT NULL,
    f_endpoint          VARCHAR(256)                        NOT NULL,
    f_bucket_name       VARCHAR(128)                        NOT NULL,
    f_access_key_id     VARCHAR(256)                        NOT NULL,
    f_access_key        VARCHAR(512)                        NOT NULL,
    f_region            VARCHAR(64)  DEFAULT ''             NULL,
    f_is_default        TINYINT      DEFAULT 0              NULL,
    f_is_enabled        TINYINT      DEFAULT 1              NULL,
    f_internal_endpoint VARCHAR(256) DEFAULT ''             NULL,
    f_site_id           VARCHAR(64)  DEFAULT ''             NULL,
    f_created_at        TIMESTAMP    DEFAULT SYSDATE        NULL,
    f_updated_at        TIMESTAMP    DEFAULT SYSDATE        NULL,
    PRIMARY KEY (f_storage_id)
);

COMMENT ON TABLE t_storage_config IS 'Storage configuration table';
COMMENT ON COLUMN t_storage_config.f_storage_id IS 'Storage ID (Snowflake ID)';
COMMENT ON COLUMN t_storage_config.f_storage_name IS 'Storage name';
COMMENT ON COLUMN t_storage_config.f_vendor_type IS 'Vendor type: OSS/OBS/ECEPH';
COMMENT ON COLUMN t_storage_config.f_endpoint IS 'Service endpoint URL';
COMMENT ON COLUMN t_storage_config.f_bucket_name IS 'Bucket name';
COMMENT ON COLUMN t_storage_config.f_access_key_id IS 'AccessKeyID (encrypted)';
COMMENT ON COLUMN t_storage_config.f_access_key IS 'AccessKeySecret (encrypted)';
COMMENT ON COLUMN t_storage_config.f_region IS 'Region (required for OSS/OBS, optional for ECEPH)';
COMMENT ON COLUMN t_storage_config.f_is_default IS 'Is default storage';
COMMENT ON COLUMN t_storage_config.f_is_enabled IS 'Is enabled';
COMMENT ON COLUMN t_storage_config.f_internal_endpoint IS 'Internal access endpoint';
COMMENT ON COLUMN t_storage_config.f_site_id IS 'Site ID for multi-tenant isolation';
COMMENT ON COLUMN t_storage_config.f_created_at IS 'Creation time';
COMMENT ON COLUMN t_storage_config.f_updated_at IS 'Update time';

-- Indexes for t_storage_config
CREATE INDEX idx_vendor_type ON t_storage_config (f_vendor_type);
CREATE INDEX idx_is_enabled ON t_storage_config (f_is_enabled);
CREATE INDEX idx_bucket_endpoint ON t_storage_config (f_bucket_name, f_endpoint);
CREATE INDEX idx_bucket_site ON t_storage_config (f_bucket_name, f_site_id);

-- Multipart upload task table for DM8
CREATE TABLE t_multipart_upload_task
(
    f_id          VARCHAR(50)                    NOT NULL,
    f_storage_id  VARCHAR(50)                    NOT NULL,
    f_object_key  VARCHAR(512)                   NOT NULL,
    f_upload_id   VARCHAR(256)                   NOT NULL,
    f_total_size  BIGINT                         NOT NULL,
    f_part_size   INT                            NOT NULL,
    f_total_parts INT                            NOT NULL,
    f_status      SMALLINT DEFAULT 0             NULL,
    f_created_at  TIMESTAMP DEFAULT SYSDATE      NULL,
    f_expires_at  TIMESTAMP                      NOT NULL,
    PRIMARY KEY (f_id)
);

COMMENT ON TABLE t_multipart_upload_task IS 'Multipart upload task table';
COMMENT ON COLUMN t_multipart_upload_task.f_id IS 'Task ID (Snowflake ID)';
COMMENT ON COLUMN t_multipart_upload_task.f_storage_id IS 'Associated storage ID';
COMMENT ON COLUMN t_multipart_upload_task.f_object_key IS 'Object key';
COMMENT ON COLUMN t_multipart_upload_task.f_upload_id IS 'Upload ID from vendor';
COMMENT ON COLUMN t_multipart_upload_task.f_total_size IS 'Total file size';
COMMENT ON COLUMN t_multipart_upload_task.f_part_size IS 'Part size in bytes';
COMMENT ON COLUMN t_multipart_upload_task.f_total_parts IS 'Total number of parts';
COMMENT ON COLUMN t_multipart_upload_task.f_status IS 'Status: 0=in progress, 1=completed, 2=cancelled';
COMMENT ON COLUMN t_multipart_upload_task.f_created_at IS 'Creation time';
COMMENT ON COLUMN t_multipart_upload_task.f_expires_at IS 'Expiration time';

-- Indexes for t_multipart_upload_task
CREATE INDEX idx_storage_id ON t_multipart_upload_task (f_storage_id);
CREATE INDEX idx_status ON t_multipart_upload_task (f_status);
CREATE INDEX idx_expires_at ON t_multipart_upload_task (f_expires_at);
