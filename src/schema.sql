CREATE TABLE IF NOT EXISTS link (
    id bigserial ,
    shortened varchar(256),
    original varchar(1024),
    clicks int4,
    PRIMARY KEY (id)
);
