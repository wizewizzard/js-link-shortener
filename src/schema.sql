CREATE TABLE IF NOT EXISTS link (
    id bigserial,
    original varchar(1024),
    clicks int4,
    PRIMARY KEY (id)
);
