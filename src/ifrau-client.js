const clientPromise = import('ifrau/client/slim.js').then((ifrau) => {
	return ifrau.SlimClient;
});

export default clientPromise;
