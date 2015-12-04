#CLINAME=client
SERNAME=chat_server
SERSRC=chat_server.c
#CLISRC=client.c	exitclient.c timeout.c
SEROBJ=$(SERSRC:.c=.o)
#CLIOBJ=$(CLISRC:.c=.o)
RM=rm -f
#INCLPATH=../../include
#LIBPATH=../../lib
#CFLAGS+=-I$(INCLPATH)
#LDFLAGS+=-L../../lib
LDLIBS+=-lssl -lcrypto -lpthread

all:server

#client:$(CLIOBJ)
#	$(CC) $(CLIOBJ) $(CFLAGS) $(LDFLAGS) $(LDLIBS) -o $(CLINAME)

server:CFLAGS+=-DSERVER
server:$(SEROBJ)
	$(CC) $(SEROBJ) $(LDLIBS) -o $(SERNAME)
#	$(CC) $(SEROBJ) $(CFLAGS) $(LDFLAGS) $(LDLIBS) -o $(SERNAME)

clean:
	-$(RM) *~
	-$(RM) *.o
	-$(RM) *.core
	-$(RM) *.swp
	-$(RM) \#*

fclean:clean
#	-$(RM) $(CLINAME)
	-$(RM) $(SERNAME)
re:fclean all

debug:CFLAGS+=-D'DEBUG=((int)5)' -g
debug:all

#debugclient:CFLAGS+=-D'DEBUG=((int)5)' -g
#debugclient:client

debugserver:CFLAGS+=-D'DEBUG=((int)5)' -g
debugserver:server
