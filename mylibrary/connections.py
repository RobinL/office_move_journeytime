# Now write out to postgres
import psycopg2
con_string = "host='localhost' dbname='postgres' user='postgres' password=''"
conn = psycopg2.connect(con_string)
cursor = conn.cursor()

from sqlalchemy import create_engine
engine = create_engine('postgresql://postgres:@localhost:5432/postgres') 

from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, MetaData

#Note automap base will only work for tables with a primary key
m = MetaData(schema='tt_gh')
Automapped_Base = automap_base(bind=engine,metadata=m)
Automapped_Base.prepare(engine, reflect=True)

session = Session(engine)