(() => {
	const hubbleToken = window.__hubbleEmbedToken || window.name;
	let nextHubbleRequestId = 0;
	const pendingHubbleRequests = new Map();
	const postHubbleRequest = (id, method, params) => {
		parent.postMessage(
			{ type: "hubble:request", id, method, params, token: hubbleToken },
			"*",
		);
	};
	const requestHubble = (method, params) =>
		new Promise((resolve, reject) => {
			const id = ++nextHubbleRequestId;
			let attempts = 0;
			const send = () => {
				if (!pendingHubbleRequests.has(id)) return;
				attempts += 1;
				postHubbleRequest(id, method, params);
				if (attempts >= 40) {
					pendingHubbleRequests.delete(id);
					reject(new Error("Hubble request timed out"));
					return;
				}
				window.setTimeout(send, 250);
			};
			pendingHubbleRequests.set(id, { resolve, reject });
			send();
		});

	window.addEventListener("message", (event) => {
		const data = event.data;
		if (!data || data.type !== "hubble:response") return;
		const pending = pendingHubbleRequests.get(data.id);
		if (!pending) return;
		pendingHubbleRequests.delete(data.id);
		if (data.ok) pending.resolve(data.value);
		else pending.reject(new Error(data.error || "Hubble request failed"));
	});

	window.hubble = {
		files: {
			list: (glob = "**/*") => requestHubble("files.list", { glob }),
			read: (path) => requestHubble("files.read", { path }),
		},
	};

	const send = () => {
		const body = document.body;
		const bodyTop = body ? body.getBoundingClientRect().top : 0;
		const bodyPaddingBlockEnd = body
			? Number.parseFloat(getComputedStyle(body).paddingBlockEnd) || 0
			: 0;
		const height = body
			? Array.from(body.children).reduce((max, child) => {
					if (!(child instanceof HTMLElement)) return max;
					if (child.tagName === "SCRIPT" || child.tagName === "STYLE")
						return max;
					return Math.max(max, child.getBoundingClientRect().bottom - bodyTop);
				}, 0) + bodyPaddingBlockEnd
			: 0;
		parent.postMessage(
			{ type: "hubble:embed-height", height, token: hubbleToken },
			"*",
		);
	};
	const schedule = () => requestAnimationFrame(send);
	const resizeObserver = new ResizeObserver(schedule);
	let isObservingBody = false;
	const observeBody = () => {
		if (!document.body || isObservingBody) return;
		resizeObserver.observe(document.body);
		isObservingBody = true;
	};
	window.addEventListener("load", () => {
		observeBody();
		schedule();
	});
	resizeObserver.observe(document.documentElement);
	if (document.readyState === "loading") {
		document.addEventListener(
			"DOMContentLoaded",
			() => {
				observeBody();
				schedule();
			},
			{ once: true },
		);
	} else {
		observeBody();
	}
	schedule();
})();
