scp index.html springboot:~/tomato
scp -r static/ springboot:~/tomato
ssh springboot 'cd ~/tomato/ && ./run.sh'