scp index.html springboot:~/punchin
scp -r static/ springboot:~/punchin
ssh springboot 'cd ~/punchin/ && ./run.sh'