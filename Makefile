##

start:
	docker run -p 10095:10095 -it --privileged=true \
  		-v ./models:/workspace/models \
  		registry.cn-hangzhou.aliyuncs.com/funasr_repo/funasr:funasr-runtime-sdk-cpu-0.4.6
