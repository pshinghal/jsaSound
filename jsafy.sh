files=`ls *.json *.js`
for x in $files;
do
	mv $x jsa$x
done;
