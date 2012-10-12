for x in `ls *.js`;
do
	touch `echo "$x" | sed "s/\(.*\)\.js/\1Data.json/"`;
done;
